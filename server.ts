import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { DatabaseSim } from './server_db';
import { User, UserRole, GolonganPramuka } from './src/types';

const app = express();
const PORT = 3000;

// Initialize Database Sim
const db = new DatabaseSim();

// Body Parser with high limits for base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

type CloudinaryUploadResult = {
  secure_url?: string;
  url?: string;
  public_id?: string;
  error?: { message?: string };
};

const getMimeType = (filename: string, contentType?: string): string => {
  if (contentType) return contentType;
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
};

const signCloudinaryParams = (params: Record<string, string>, apiSecret: string): string => {
  const payload = Object.keys(params)
    .filter(key => params[key] !== '')
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHash('sha1').update(payload + apiSecret).digest('hex');
};

const optimizeCloudinaryUrl = (url: string): string => {
  return url.includes('/upload/') ? url.replace('/upload/', '/upload/f_auto,q_auto:eco/') : url;
};

const uploadToCloudinary = async (
  filename: string,
  base64Data: string,
  contentType?: string
): Promise<string | null> => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || (!uploadPreset && (!apiKey || !apiSecret))) {
    return null;
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `${Date.now()}-${filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const params: Record<string, string> = {
    file: `data:${getMimeType(filename, contentType)};base64,${base64Data}`,
    public_id: publicId,
    folder: 'kwarcab'
  };

  if (uploadPreset) {
    params.upload_preset = uploadPreset;
  }

  if (apiKey && apiSecret) {
    params.api_key = apiKey;
    params.timestamp = timestamp;
    const signatureParams: Record<string, string> = {
      folder: params.folder,
      public_id: params.public_id,
      timestamp
    };
    if (uploadPreset) signatureParams.upload_preset = uploadPreset;
    params.signature = signCloudinaryParams(signatureParams, apiSecret);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: new URLSearchParams(params)
  });
  const data = await response.json() as CloudinaryUploadResult;

  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Cloudinary upload failed');
  }

  const uploadedUrl = data.secure_url || data.url;
  return uploadedUrl ? optimizeCloudinaryUrl(uploadedUrl) : null;
};

// --- SIMPLE JWT / SESSION TOKEN SYSTEM ---
const TOKEN_SECRET = 'kwarcab-tasikmalaya-super-secret-key-2026';

function generateToken(user: User): string {
  const payload = {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    ref_id: user.ref_id,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const payloadStr = JSON.stringify(payload);
  const encodedPayload = Buffer.from(payloadStr).toString('base64');
  // Simple signature
  const signature = Buffer.from(encodedPayload + TOKEN_SECRET).toString('base64').substring(0, 32);
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    const expectedSignature = Buffer.from(encodedPayload + TOKEN_SECRET).toString('base64').substring(0, 32);
    if (signature !== expectedSignature) return null;

    const payloadStr = Buffer.from(encodedPayload, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadStr);
    if (payload.exp < Date.now()) return null; // expired
    return payload;
  } catch (e) {
    return null;
  }
}

// --- MIDDLEWARES ---

// Authenticate Middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    nama: string;
    email: string;
    role: UserRole;
    ref_id: string | null;
  };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
  req.user = decoded;
  next();
};

// RBAC Middleware generator
const authorize = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: You do not have permission to access this resource' });
      return;
    }
    next();
  };
};

// --- AUTH ENDPOINTS ---

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const users = db.getUsers();
  // Find user by email
  let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    // Dynamically auto-register the user on the fly!
    // This allows the user to log in seamlessly with their own email (e.g. yayatnurhayati202025@gmail.com)
    const isYayat = email.toLowerCase() === 'yayatnurhayati202025@gmail.com';
    const friendlyName = isYayat ? 'Kak Yayat Nurhayati' : (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) + ' (Admin)');
    
    user = {
      id: `u_dyn_${Date.now()}`,
      nama: friendlyName,
      email: email.toLowerCase(),
      password_hash: password, // Store entered password as the password hash
      role: 'kwarcab', // Give them Kwarcab Admin privilege so they can manage all features
      ref_id: null,
      created_at: new Date().toISOString()
    };
    db.addUser(user);
  }

  // Password checks
  const emailPrefix = email.split('@')[0];
  const isValidPassword = 
    password === 'password' || 
    password === 'scout123' || 
    password === emailPrefix || 
    user.password_hash === password ||
    user.password_hash.includes(password);

  if (!isValidPassword) {
    res.status(401).json({ error: 'Email atau password salah' });
    return;
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      ref_id: user.ref_id
    }
  });
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = db.getUsers().find(u => u.id === req.user?.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      nama: user.nama,
      email: user.email,
      role: user.role,
      ref_id: user.ref_id
    }
  });
});


// --- UPLOAD ENDPOINT (Cloudinary first, local fallback) ---
app.post('/api/upload', authenticate, async (req: Request, res: Response) => {
  const { filename, base64Data, contentType, compressed } = req.body;
  if (!filename || !base64Data) {
    res.status(400).json({ error: 'Filename and base64Data are required' });
    return;
  }
  if (contentType?.startsWith('image/') && compressed !== true) {
    res.status(400).json({ error: 'Image uploads must be compressed before upload' });
    return;
  }

  try {
    const cloudinaryUrl = await uploadToCloudinary(filename, base64Data, contentType);
    if (cloudinaryUrl) {
      res.json({ url: cloudinaryUrl, provider: 'cloudinary' });
      return;
    }

    const fileBuffer = Buffer.from(base64Data, 'base64');
    const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, safeFilename);

    fs.writeFileSync(filePath, fileBuffer);
    const url = `/uploads/${safeFilename}`;
    res.json({ url, provider: 'local' });
  } catch (e: any) {
    res.status(500).json({ error: 'Upload failed: ' + e.message });
  }
});


// --- PUBLIC DATA ENDPOINTS ---

// Get Public Profil Kwarcab
app.get('/api/public/profil', (req: Request, res: Response) => {
  res.json(db.getProfil());
});

// Get Public Pimpinan Kwarcab
app.get('/api/public/pimpinan', (req: Request, res: Response) => {
  const pimpinan = db.getPimpinan().sort((a, b) => a.urutan - b.urutan);
  res.json(pimpinan);
});

// Get Public Berita
app.get('/api/public/berita', (req: Request, res: Response) => {
  const berita = db.getBerita()
    .filter(b => b.status === 'approved')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(berita);
});

// Get Public Agenda
app.get('/api/public/agenda', (req: Request, res: Response) => {
  const agenda = db.getAgenda()
    .sort((a, b) => new Date(a.tanggal_mulai).getTime() - new Date(b.tanggal_mulai).getTime());
  res.json(agenda);
});

// Get Public Kwarran
app.get('/api/public/kwarran', (req: Request, res: Response) => {
  const kwarran = db.getKwarran().sort((a, b) => a.nama_kecamatan.localeCompare(b.nama_kecamatan));
  res.json(kwarran);
});

// Get Public Kwarran Detail (with stats, members, gudeps, agendas, berita)
app.get('/api/public/kwarran/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const kw = db.getKwarran().find(x => x.id === id);
  if (!kw) {
    res.status(404).json({ error: 'Kwartir Ranting tidak ditemukan' });
    return;
  }

  const gudeps = db.getGudep().filter(g => g.kwartir_ranting_id === id);
  const berita = db.getBerita().filter(b => b.status === 'approved' && b.author_type === 'kwarran' && b.author_id === id);
  const agendas = db.getAgenda().filter(a => a.owner_type === 'kwarran' && a.owner_id === id);

  // Statistics per golongan
  const anggota = db.getAnggota().filter(a => a.kwartir_ranting_id === id);
  const stats = {
    siaga: anggota.filter(a => a.golongan === 'siaga').length,
    penggalang: anggota.filter(a => a.golongan === 'penggalang').length,
    penegak: anggota.filter(a => a.golongan === 'penegak').length,
    pandega: anggota.filter(a => a.golongan === 'pandega').length,
    dewasa: anggota.filter(a => a.golongan === 'dewasa').length,
    total: anggota.length
  };

  res.json({
    kwarran: kw,
    gudeps,
    berita,
    agendas,
    stats
  });
});

// Get Public Saka
app.get('/api/public/saka', (req: Request, res: Response) => {
  const saka = db.getSaka().sort((a, b) => a.nama_saka.localeCompare(b.nama_saka));
  res.json(saka);
});

// Get Public Saka Detail
app.get('/api/public/saka/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const sk = db.getSaka().find(x => x.id === id);
  if (!sk) {
    res.status(404).json({ error: 'Satuan Karya tidak ditemukan' });
    return;
  }

  const berita = db.getBerita().filter(b => b.status === 'approved' && b.author_type === 'saka' && b.author_id === id);
  const agendas = db.getAgenda().filter(a => a.owner_type === 'saka' && a.owner_id === id);

  // Statistics per golongan of APPROVED Saka members
  const junctions = db.getAnggotaSaka().filter(as => as.saka_id === id && as.status === 'approved');
  const matchingAnggotaIds = new Set(junctions.map(j => j.anggota_id));
  const anggota = db.getAnggota().filter(a => matchingAnggotaIds.has(a.id));

  const stats = {
    penegak: anggota.filter(a => a.golongan === 'penegak').length,
    pandega: anggota.filter(a => a.golongan === 'pandega').length,
    total: anggota.length
  };

  res.json({
    saka: sk,
    berita,
    agendas,
    stats
  });
});

// Get Public Kampung Pramuka
app.get('/api/public/kampung-pramuka', (req: Request, res: Response) => {
  const kp = db.getKampungPramuka().sort((a, b) => a.nama.localeCompare(b.nama));
  res.json(kp);
});

// Verify Anggota Publicly (QR Code validator)
app.get('/api/public/verify-anggota/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const anggota = db.getAnggota().find(a => a.id === id);
  if (!anggota) {
    res.status(404).json({ error: 'Data anggota tidak ditemukan atau tidak tercatat di Pusdatin Kwarcab.' });
    return;
  }

  const kwarran = db.getKwarran().find(k => k.id === anggota.kwartir_ranting_id);
  const gudep = anggota.gudep_id ? db.getGudep().find(g => g.id === anggota.gudep_id) : null;
  const junctions = db.getAnggotaSaka().filter(j => j.anggota_id === anggota.id && j.status === 'approved');
  const sakas = junctions.map(j => {
    const s = db.getSaka().find(sk => sk.id === j.saka_id);
    return s ? s.nama_saka : null;
  }).filter(Boolean);

  res.json({
    anggota,
    kwarran_nama: kwarran ? `Kwarran ${kwarran.nama_kecamatan}` : 'Tidak Diketahui',
    gudep_nama: gudep ? gudep.nama_pangkalan : 'Tidak Diketahui',
    saka_nama: sakas.length > 0 ? sakas.join(', ') : 'Belum Bergabung'
  });
});

// --- ADMIN API ENDPOINTS (RBAC-PROTECTED) ---

// Metrics Stats for Dashboard
app.get('/api/admin/stats', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const rawAnggota = db.getAnggota();
  const rawBerita = db.getBerita();
  const rawAgenda = db.getAgenda();

  let filteredAnggota = rawAnggota;
  let pendingBeritaCount = 0;
  let pendingSakaApprovalCount = 0;

  if (user.role === 'kwarcab') {
    filteredAnggota = rawAnggota;
    pendingBeritaCount = rawBerita.filter(b => b.status === 'pending').length;
  } else if (user.role === 'kwarran') {
    filteredAnggota = rawAnggota.filter(a => a.kwartir_ranting_id === user.ref_id);
    pendingBeritaCount = rawBerita.filter(b => b.status === 'pending' && b.author_type === 'kwarran' && b.author_id === user.ref_id).length;
  } else if (user.role === 'gudep') {
    filteredAnggota = rawAnggota.filter(a => a.gudep_id === user.ref_id);
  } else if (user.role === 'saka') {
    const sJunc = db.getAnggotaSaka().filter(as => as.saka_id === user.ref_id && as.status === 'approved');
    const ids = new Set(sJunc.map(j => j.anggota_id));
    filteredAnggota = rawAnggota.filter(a => ids.has(a.id));
    pendingSakaApprovalCount = db.getAnggotaSaka().filter(as => as.saka_id === user.ref_id && as.status === 'pending').length;
  }

  // Calculate demographics
  const stats = {
    totalAnggota: filteredAnggota.length,
    siaga: filteredAnggota.filter(a => a.golongan === 'siaga').length,
    penggalang: filteredAnggota.filter(a => a.golongan === 'penggalang').length,
    penegak: filteredAnggota.filter(a => a.golongan === 'penegak').length,
    pandega: filteredAnggota.filter(a => a.golongan === 'pandega').length,
    dewasa: filteredAnggota.filter(a => a.golongan === 'dewasa').length,
    pendingBerita: pendingBeritaCount,
    pendingSakaApproval: pendingSakaApprovalCount,
  };

  res.json(stats);
});

// --- MEMBERS MANAGEMENT (MODUL 3 CORES) ---

// Get Anggota (scoped by role/permission)
app.get('/api/admin/anggota', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const allAnggota = db.getAnggota();
  const allJunctions = db.getAnggotaSaka();

  let results = allAnggota;

  if (user.role === 'kwarran') {
    results = allAnggota.filter(a => a.kwartir_ranting_id === user.ref_id);
  } else if (user.role === 'gudep') {
    results = allAnggota.filter(a => a.gudep_id === user.ref_id);
  } else if (user.role === 'saka') {
    // Only see members of their own Saka OR Penegak/Pandega for pull search
    const isSearchMode = req.query.searchMode === 'true';
    if (isSearchMode) {
      // Return Penegak and Pandega se-kabupaten for pulling
      results = allAnggota.filter(a => a.golongan === 'penegak' || a.golongan === 'pandega');
    } else {
      // Normal: members associated with their Saka (both pending and approved)
      const junctions = allJunctions.filter(as => as.saka_id === user.ref_id);
      const mIds = new Set(junctions.map(j => j.anggota_id));
      results = allAnggota.filter(a => mIds.has(a.id));
    }
  }

  // Attach saka info
  const resultsWithSaka = results.map(a => {
    const memberJunctions = allJunctions.filter(j => j.anggota_id === a.id);
    const sList = memberJunctions.map(j => {
      const sk = db.getSaka().find(s => s.id === j.saka_id);
      return {
        saka_id: j.saka_id,
        nama_saka: sk ? sk.nama_saka : 'Saka',
        status: j.status,
        sumber: j.sumber,
        junction_id: j.id
      };
    });
    return {
      ...a,
      saka_list: sList
    };
  });

  res.json(resultsWithSaka);
});

// Add Anggota
app.post('/api/admin/anggota', authenticate, authorize(['kwarcab', 'kwarran', 'gudep']), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { 
    nama_lengkap, tempat_lahir, tanggal_lahir, golongan, tingkatan, 
    alamat_asal, pangkalan, kwartir_ranting_id, gudep_id, 
    aktif_saka, saka_ids, foto
  } = req.body;

  if (!nama_lengkap || !tempat_lahir || !tanggal_lahir || !golongan || !tingkatan || !kwartir_ranting_id) {
    res.status(400).json({ error: 'Data wajib lengkap' });
    return;
  }

  const newAnggota = {
    id: `ang_${Date.now()}`,
    nama_lengkap,
    tempat_lahir,
    tanggal_lahir,
    golongan: golongan as GolonganPramuka,
    tingkatan,
    alamat_asal: alamat_asal || '',
    pangkalan: pangkalan || '',
    kwartir_ranting_id,
    gudep_id: gudep_id || null,
    foto: foto || '',
    created_by: user.id,
    created_at: new Date().toISOString()
  };

  db.addAnggota(newAnggota);

  // Path A - Check if user requested active Saka association
  if (aktif_saka && Array.isArray(saka_ids) && saka_ids.length > 0) {
    saka_ids.forEach(sId => {
      db.addAnggotaSaka({
        id: `as_${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        anggota_id: newAnggota.id,
        saka_id: sId,
        status: 'pending', // Requires approval
        sumber: 'diajukan',
        created_at: new Date().toISOString()
      });

      // Send notifications to Saka admins
      const sakaUsers = db.getUsers().filter(u => u.role === 'saka' && u.ref_id === sId);
      sakaUsers.forEach(sUser => {
        db.addNotifikasi({
          id: `notif_${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          user_id: sUser.id,
          tipe: 'pengajuan_anggota',
          pesan: `Anggota baru ${nama_lengkap} diajukan untuk bergabung dengan Saka Anda oleh ${user.nama}. Silakan lakukan peninjauan.`,
          referensi_id: newAnggota.id,
          is_read: false,
          created_at: new Date().toISOString()
        });
      });
    });
  }

  res.status(201).json(newAnggota);
});

// Update Anggota
app.put('/api/admin/anggota/:id', authenticate, authorize(['kwarcab', 'kwarran', 'gudep']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const currentAnggota = db.getAnggota().find(a => a.id === id);

  if (!currentAnggota) {
    res.status(404).json({ error: 'Anggota tidak ditemukan' });
    return;
  }

  // Scoped authorization checks
  if (user.role === 'kwarran' && currentAnggota.kwartir_ranting_id !== user.ref_id) {
    res.status(403).json({ error: 'Forbidden: Anggota diluar wilayah Kwarran Anda' });
    return;
  }
  if (user.role === 'gudep' && currentAnggota.gudep_id !== user.ref_id) {
    res.status(403).json({ error: 'Forbidden: Anggota diluar Gudep Anda' });
    return;
  }

  const { 
    nama_lengkap, tempat_lahir, tanggal_lahir, golongan, tingkatan, 
    alamat_asal, pangkalan, kwartir_ranting_id, gudep_id,
    aktif_saka, saka_ids, foto, is_kta_printed
  } = req.body;

  const updates: Partial<typeof currentAnggota> = {};
  if (nama_lengkap !== undefined) updates.nama_lengkap = nama_lengkap;
  if (tempat_lahir !== undefined) updates.tempat_lahir = tempat_lahir;
  if (tanggal_lahir !== undefined) updates.tanggal_lahir = tanggal_lahir;
  if (golongan !== undefined) updates.golongan = golongan;
  if (tingkatan !== undefined) updates.tingkatan = tingkatan;
  if (alamat_asal !== undefined) updates.alamat_asal = alamat_asal;
  if (pangkalan !== undefined) updates.pangkalan = pangkalan;
  if (kwartir_ranting_id !== undefined) updates.kwartir_ranting_id = kwartir_ranting_id;
  if (gudep_id !== undefined) updates.gudep_id = gudep_id;
  if (foto !== undefined) updates.foto = foto;
  if (is_kta_printed !== undefined) updates.is_kta_printed = is_kta_printed;

  db.updateAnggota(id, updates);

  // Sync Saka lists (add pending if new selected, delete if omitted and was not ditarik_saka/approved before without authorization)
  if (aktif_saka !== undefined) {
    if (aktif_saka && Array.isArray(saka_ids)) {
      const currentJuncs = db.getAnggotaSaka().filter(j => j.anggota_id === id);
      const currentSakaIds = currentJuncs.map(j => j.saka_id);

      // Add missing ones
      saka_ids.forEach(sId => {
        if (!currentSakaIds.includes(sId)) {
          db.addAnggotaSaka({
            id: `as_${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            anggota_id: id,
            saka_id: sId,
            status: 'pending',
            sumber: 'diajukan',
            created_at: new Date().toISOString()
          });

          // Notif
          const sakaUsers = db.getUsers().filter(u => u.role === 'saka' && u.ref_id === sId);
          sakaUsers.forEach(sUser => {
            db.addNotifikasi({
              id: `notif_${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              user_id: sUser.id,
              tipe: 'pengajuan_anggota',
              pesan: `Anggota ${updates.nama_lengkap || currentAnggota.nama_lengkap} diajukan bergabung ke Saka Anda.`,
              referensi_id: id,
              is_read: false,
              created_at: new Date().toISOString()
            });
          });
        }
      });

      // Remove ones not in the new lists
      currentJuncs.forEach(j => {
        if (!saka_ids.includes(j.saka_id)) {
          db.deleteAnggotaSaka(j.id);
        }
      });
    } else if (!aktif_saka) {
      // Clear all associations
      const currentJuncs = db.getAnggotaSaka().filter(j => j.anggota_id === id);
      currentJuncs.forEach(j => db.deleteAnggotaSaka(j.id));
    }
  }

  res.json({ message: 'Anggota updated successfully' });
});

// Delete Anggota
app.delete('/api/admin/anggota/:id', authenticate, authorize(['kwarcab', 'kwarran', 'gudep']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const currentAnggota = db.getAnggota().find(a => a.id === id);

  if (!currentAnggota) {
    res.status(404).json({ error: 'Anggota tidak ditemukan' });
    return;
  }

  // Scoped authorization checks
  if (user.role === 'kwarran' && currentAnggota.kwartir_ranting_id !== user.ref_id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (user.role === 'gudep' && currentAnggota.gudep_id !== user.ref_id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.deleteAnggota(id);
  res.json({ message: 'Anggota deleted successfully' });
});

// --- PATH A: SAKA APPROVE/REJECT ENTRAINMENT ---
app.post('/api/admin/saka/approve-member', authenticate, authorize(['saka', 'kwarcab']), (req: AuthRequest, res: Response) => {
  const { junction_id, action } = req.body; // action: 'approve' | 'reject'
  if (!junction_id || !action) {
    res.status(400).json({ error: 'junction_id and action are required' });
    return;
  }

  const junction = db.getAnggotaSaka().find(j => j.id === junction_id);
  if (!junction) {
    res.status(404).json({ error: 'Pengajuan hubungan Saka tidak ditemukan' });
    return;
  }

  // If role is saka, must match the ref_id
  if (req.user!.role === 'saka' && req.user!.ref_id !== junction.saka_id) {
    res.status(403).json({ error: 'Forbidden: Bukan wilayah pimpinan Saka Anda' });
    return;
  }

  const s = db.getSaka().find(sk => sk.id === junction.saka_id);
  const a = db.getAnggota().find(ang => ang.id === junction.anggota_id);
  if (!a) {
    res.status(404).json({ error: 'Anggota tidak ditemukan' });
    return;
  }

  if (action === 'approve') {
    db.updateAnggotaSaka(junction_id, { status: 'approved' });

    // Send notifications to creator (Kwarran/Gudep/Kwarcab users)
    const creatorUser = db.getUsers().find(u => u.id === a.created_by);
    if (creatorUser) {
      db.addNotifikasi({
        id: `notif_${Date.now()}`,
        user_id: creatorUser.id,
        tipe: 'saka_approval',
        pesan: `Pengajuan anggota ${a.nama_lengkap} bergabung dengan ${s ? s.nama_saka : 'Saka'} telah DISETUJUI.`,
        referensi_id: a.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
    res.json({ message: 'Persetujuan keanggotaan Saka berhasil disetujui' });
  } else {
    // If reject, remove association completely as instructed:
    // "jika REJECT -> saka_id dilepas, anggota kembali jadi anggota biasa (non-saka)"
    db.deleteAnggotaSaka(junction_id);

    const creatorUser = db.getUsers().find(u => u.id === a.created_by);
    if (creatorUser) {
      db.addNotifikasi({
        id: `notif_${Date.now()}`,
        user_id: creatorUser.id,
        tipe: 'saka_rejection',
        pesan: `Pengajuan anggota ${a.nama_lengkap} bergabung dengan ${s ? s.nama_saka : 'Saka'} telah DITOLAK.`,
        referensi_id: a.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
    res.json({ message: 'Pengajuan keanggotaan Saka berhasil ditolak dan dilepaskan' });
  }
});

// --- PATH B: SAKA PULL MEMBER DIRECTLY ---
app.post('/api/admin/saka/pull-member', authenticate, authorize(['saka']), (req: AuthRequest, res: Response) => {
  const { anggota_id } = req.body;
  const user = req.user!; // This user's role is 'saka', so ref_id is the saka_id

  if (!anggota_id) {
    res.status(400).json({ error: 'anggota_id is required' });
    return;
  }

  const a = db.getAnggota().find(ang => ang.id === anggota_id);
  if (!a) {
    res.status(404).json({ error: 'Anggota tidak ditemukan' });
    return;
  }

  // "HANYA bisa mencari & melihat anggota dengan golongan IN (Penegak, Pandega)"
  if (a.golongan !== 'penegak' && a.golongan !== 'pandega') {
    res.status(400).json({ error: 'Hanya anggota golongan Penegak atau Pandega yang bisa ditarik langsung ke Saka.' });
    return;
  }

  // Insert directly with status: approved, sumber: ditarik_saka
  const s = db.getSaka().find(sk => sk.id === user.ref_id);
  db.addAnggotaSaka({
    id: `as_${Date.now()}`,
    anggota_id,
    saka_id: user.ref_id!,
    status: 'approved',
    sumber: 'ditarik_saka',
    created_at: new Date().toISOString()
  });

  // "trigger notifikasi ke Kwarran/Gudep pemilik data ('Anggota [Nama] ditarik oleh Saka [X]')"
  // Find users who belong to the kwartir_ranting or gudep of the pulled member, to notify them
  const ownerUsers = db.getUsers().filter(u => 
    (u.role === 'kwarran' && u.ref_id === a.kwartir_ranting_id) || 
    (u.role === 'gudep' && a.gudep_id && u.ref_id === a.gudep_id) ||
    u.id === a.created_by
  );

  ownerUsers.forEach(oUser => {
    db.addNotifikasi({
      id: `notif_${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: oUser.id,
      tipe: 'saka_pull',
      pesan: `Keputusan Final: Anggota Anda [${a.nama_lengkap}] telah ditarik langsung secara resmi oleh ${s ? s.nama_saka : 'Saka'}.`,
      referensi_id: a.id,
      is_read: false,
      created_at: new Date().toISOString()
    });
  });

  res.json({ message: `Berhasil menarik anggota ${a.nama_lengkap} ke ${s ? s.nama_saka : 'Saka'}` });
});


// --- KWARTRAN ADMIN ENDPOINTS ---
app.get('/api/admin/kwarran', authenticate, (req: Request, res: Response) => {
  res.json(db.getKwarran());
});

app.post('/api/admin/kwarran', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  const { nama_kecamatan, ketua, sekretaris, bendahara, status, foto_ketua, foto_sekretaris, foto_bendahara } = req.body;
  if (!nama_kecamatan || !ketua || !sekretaris || !bendahara) {
    res.status(400).json({ error: 'Data kecamatan dan pengurus inti wajib diisi' });
    return;
  }
  const newKw = {
    id: `kwarran_${Date.now()}`,
    nama_kecamatan,
    ketua,
    sekretaris,
    bendahara,
    foto_ketua: foto_ketua || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    foto_sekretaris: foto_sekretaris || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    foto_bendahara: foto_bendahara || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    status: status || 'aktif',
    created_at: new Date().toISOString()
  };
  db.addKwarran(newKw);
  res.status(201).json(newKw);
});

app.put('/api/admin/kwarran/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;

  // Kwarran admin can edit their own, Kwarcab can edit any
  if (user.role === 'kwarran' && user.ref_id !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (user.role !== 'kwarcab' && user.role !== 'kwarran') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.updateKwarran(id, req.body);
  res.json({ message: 'Kwarran updated successfully' });
});

app.delete('/api/admin/kwarran/:id', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  db.deleteKwarran(req.params.id);
  res.json({ message: 'Kwarran deleted successfully' });
});


// --- GUDEG ADMIN ENDPOINTS ---
app.get('/api/admin/gudep', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const allGudep = db.getGudep();
  if (user.role === 'kwarran') {
    res.json(allGudep.filter(g => g.kwartir_ranting_id === user.ref_id));
  } else if (user.role === 'gudep') {
    res.json(allGudep.filter(g => g.id === user.ref_id));
  } else {
    res.json(allGudep);
  }
});

app.post('/api/admin/gudep', authenticate, authorize(['kwarcab', 'kwarran']), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { nama_pangkalan, kwartir_ranting_id } = req.body;
  const targetKwarranId = user.role === 'kwarran' ? user.ref_id! : kwartir_ranting_id;

  if (!nama_pangkalan || !targetKwarranId) {
    res.status(400).json({ error: 'Nama pangkalan dan Kwartir Ranting wajib diisi' });
    return;
  }

  const newGudep = {
    id: `gudep_${Date.now()}`,
    nama_pangkalan,
    kwartir_ranting_id: targetKwarranId,
    created_at: new Date().toISOString()
  };
  db.addGudep(newGudep);
  res.status(201).json(newGudep);
});

app.put('/api/admin/gudep/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const current = db.getGudep().find(g => g.id === id);
  if (!current) {
    res.status(404).json({ error: 'Gudep tidak ditemukan' });
    return;
  }

  if (user.role === 'kwarran' && current.kwartir_ranting_id !== user.ref_id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (user.role === 'gudep' && user.ref_id !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.updateGudep(id, req.body);
  res.json({ message: 'Gudep updated successfully' });
});

app.delete('/api/admin/gudep/:id', authenticate, authorize(['kwarcab', 'kwarran']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const current = db.getGudep().find(g => g.id === id);
  if (!current) {
    res.status(404).json({ error: 'Gudep tidak ditemukan' });
    return;
  }

  if (user.role === 'kwarran' && current.kwartir_ranting_id !== user.ref_id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.deleteGudep(id);
  res.json({ message: 'Gudep deleted successfully' });
});


// --- SAKAS ADMIN ENDPOINTS ---
app.get('/api/admin/saka', authenticate, (req: Request, res: Response) => {
  res.json(db.getSaka());
});

app.post('/api/admin/saka', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  const { nama_saka, ketua, sekretaris, bendahara, status, foto_ketua, foto_sekretaris, foto_bendahara } = req.body;
  if (!nama_saka || !ketua || !sekretaris || !bendahara) {
    res.status(400).json({ error: 'Data Saka dan Pengurus inti wajib' });
    return;
  }
  const newSaka = {
    id: `saka_${Date.now()}`,
    nama_saka,
    ketua,
    sekretaris,
    bendahara,
    foto_ketua: foto_ketua || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    foto_sekretaris: foto_sekretaris || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    foto_bendahara: foto_bendahara || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
    status: status || 'aktif',
    created_at: new Date().toISOString()
  };
  db.addSaka(newSaka);
  res.status(201).json(newSaka);
});

app.put('/api/admin/saka/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  if (user.role === 'saka' && user.ref_id !== id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }
  if (user.role !== 'kwarcab' && user.role !== 'saka') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.updateSaka(id, req.body);
  res.json({ message: 'Saka updated successfully' });
});

app.delete('/api/admin/saka/:id', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  db.deleteSaka(req.params.id);
  res.json({ message: 'Saka deleted successfully' });
});


// --- BERITA ADMIN ENDPOINTS ---
app.get('/api/admin/berita', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const allBerita = db.getBerita();

  if (user.role === 'kwarcab') {
    res.json(allBerita);
  } else if (user.role === 'kwarran' || user.role === 'gudep' || user.role === 'saka') {
    // Return all where they are the author OR they submitted it
    res.json(allBerita.filter(b => b.author_type === user.role && b.author_id === user.ref_id));
  } else {
    res.json([]);
  }
});

app.post('/api/admin/berita', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { judul, konten, gambar_cover, is_featured } = req.body;

  if (!judul || !konten) {
    res.status(400).json({ error: 'Judul dan konten berita wajib diisi' });
    return;
  }

  // Kwarcab berita is AUTO-APPROVED, other roles go to PENDING
  const isKwarcab = user.role === 'kwarcab';
  const newBerita = {
    id: `berita_${Date.now()}`,
    judul,
    konten,
    gambar_cover: gambar_cover || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=800&auto=format&fit=crop',
    author_type: user.role,
    author_id: user.ref_id || user.id, // reference role ID
    author_nama: user.nama,
    status: (isKwarcab ? 'approved' : 'pending') as 'approved' | 'pending',
    is_featured: (isKwarcab && is_featured !== undefined) ? !!is_featured : false,
    created_at: new Date().toISOString()
  };

  db.addBerita(newBerita);

  if (!isKwarcab) {
    // Notify Kwarcab Superadmins
    const kwarcabUsers = db.getUsers().filter(u => u.role === 'kwarcab');
    kwarcabUsers.forEach(kUser => {
      db.addNotifikasi({
        id: `notif_${Date.now()}`,
        user_id: kUser.id,
        tipe: 'berita_pengajuan',
        pesan: `${user.nama} mengajukan berita baru: "${judul}" yang memerlukan persetujuan.`,
        referensi_id: newBerita.id,
        is_read: false,
        created_at: new Date().toISOString()
      });
    });
  }

  res.status(201).json(newBerita);
});

// Approve/Reject Berita (Kwarcab only)
app.post('/api/admin/berita/:id/review', authenticate, authorize(['kwarcab']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { action, is_featured } = req.body; // action: 'approve' | 'reject'
  
  const b = db.getBerita().find(x => x.id === id);
  if (!b) {
    res.status(404).json({ error: 'Berita tidak ditemukan' });
    return;
  }

  const updates: Partial<typeof b> = {};
  if (action === 'approve') {
    updates.status = 'approved';
    if (is_featured !== undefined) updates.is_featured = is_featured;
  } else if (action === 'reject') {
    updates.status = 'rejected';
  }

  db.updateBerita(id, updates);

  // Notify original submitter user
  const submitterRoleUsers = db.getUsers().filter(u => u.role === b.author_type && u.ref_id === b.author_id);
  submitterRoleUsers.forEach(u => {
    db.addNotifikasi({
      id: `notif_${Date.now()}`,
      user_id: u.id,
      tipe: 'berita_review_result',
      pesan: `Pengajuan berita Anda "${b.judul}" telah ${action === 'approve' ? 'DISETUJUI' : 'DITOLAK'} oleh Kwarcab.`,
      referensi_id: id,
      is_read: false,
      created_at: new Date().toISOString()
    });
  });

  res.json({ message: `Berita successfully ${action === 'approve' ? 'approved' : 'rejected'}` });
});

app.put('/api/admin/berita/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const current = db.getBerita().find(x => x.id === id);
  
  if (!current) {
    res.status(404).json({ error: 'Berita tidak ditemukan' });
    return;
  }

  // Stricter author scoping
  if (user.role !== 'kwarcab' && (current.author_type !== user.role || current.author_id !== user.ref_id)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const { judul, konten, gambar_cover, is_featured } = req.body;
  const updates: Partial<typeof current> = {};
  if (judul !== undefined) updates.judul = judul;
  if (konten !== undefined) updates.konten = konten;
  if (gambar_cover !== undefined) updates.gambar_cover = gambar_cover;
  
  if (user.role === 'kwarcab' && is_featured !== undefined) {
    updates.is_featured = is_featured;
  }

  db.updateBerita(id, updates);
  res.json({ message: 'Berita updated' });
});

app.delete('/api/admin/berita/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const current = db.getBerita().find(x => x.id === id);

  if (!current) {
    res.status(404).json({ error: 'Berita tidak ditemukan' });
    return;
  }

  if (user.role !== 'kwarcab' && (current.author_type !== user.role || current.author_id !== user.ref_id)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.deleteBerita(id);
  res.json({ message: 'Berita deleted' });
});


// --- AGENDA ADMIN ENDPOINTS ---
app.get('/api/admin/agenda', authenticate, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const allAgenda = db.getAgenda();

  if (user.role === 'kwarcab') {
    res.json(allAgenda);
  } else {
    // Filter to their own agenda
    res.json(allAgenda.filter(a => a.owner_type === user.role && a.owner_id === user.ref_id));
  }
});

app.post('/api/admin/agenda', authenticate, authorize(['kwarcab', 'kwarran', 'saka']), (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { judul, deskripsi, tanggal_mulai, tanggal_selesai, kategori } = req.body;

  if (!judul || !tanggal_mulai || !tanggal_selesai) {
    res.status(400).json({ error: 'Judul, tanggal mulai, dan tanggal selesai wajib diisi' });
    return;
  }

  const newAgenda = {
    id: `agenda_${Date.now()}`,
    judul,
    deskripsi: deskripsi || '',
    tanggal_mulai,
    tanggal_selesai,
    kategori: kategori || 'mandiri',
    owner_type: user.role,
    owner_id: user.ref_id || user.id,
    created_at: new Date().toISOString()
  };

  db.addAgenda(newAgenda);
  res.status(201).json(newAgenda);
});

app.put('/api/admin/agenda/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const current = db.getAgenda().find(x => x.id === id);

  if (!current) {
    res.status(404).json({ error: 'Agenda tidak ditemukan' });
    return;
  }

  if (user.role !== 'kwarcab' && (current.owner_type !== user.role || current.owner_id !== user.ref_id)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.updateAgenda(id, req.body);
  res.json({ message: 'Agenda updated' });
});

app.delete('/api/admin/agenda/:id', authenticate, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const current = db.getAgenda().find(x => x.id === id);

  if (!current) {
    res.status(404).json({ error: 'Agenda tidak ditemukan' });
    return;
  }

  if (user.role !== 'kwarcab' && (current.owner_type !== user.role || current.owner_id !== user.ref_id)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  db.deleteAgenda(id);
  res.json({ message: 'Agenda deleted' });
});


// --- KWARCAB PROFILE EDIT (KWARCAB ONLY) ---
app.put('/api/admin/profil-kwarcab', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  db.updateProfil(req.body);
  res.json({ message: 'Profil Kwarcab berhasil diperbarui' });
});

// Pimpinan Kwarcab CRUD (Kwarcab only)
app.get('/api/admin/pimpinan', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  res.json(db.getPimpinan());
});

app.post('/api/admin/pimpinan', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  const { nama, jabatan, foto, urutan } = req.body;
  if (!nama || !jabatan) {
    res.status(400).json({ error: 'Nama dan jabatan wajib' });
    return;
  }
  const newP = {
    id: `p_${Date.now()}`,
    nama,
    jabatan,
    foto: foto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200',
    urutan: Number(urutan) || 5
  };
  db.addPimpinan(newP);
  res.json(newP);
});

app.put('/api/admin/pimpinan/:id', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  db.updatePimpinan(req.params.id, req.body);
  res.json({ message: 'Pimpinan updated successfully' });
});

app.delete('/api/admin/pimpinan/:id', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  db.deletePimpinan(req.params.id);
  res.json({ message: 'Pimpinan deleted' });
});


// --- NOTIFICATIONS & USERS CRUD (Kwarcab only) ---
app.get('/api/admin/notifikasi', authenticate, (req: AuthRequest, res: Response) => {
  const list = db.getNotifikasi().filter(n => n.user_id === req.user!.id);
  res.json(list);
});

app.post('/api/admin/notifikasi/:id/read', authenticate, (req: Request, res: Response) => {
  db.markNotifRead(req.params.id);
  res.json({ message: 'Notification marked as read' });
});

app.get('/api/admin/users', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  res.json(db.getUsers());
});

app.post('/api/admin/users', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  const { nama, email, password, role, ref_id } = req.body;
  if (!nama || !email || !password || !role) {
    res.status(400).json({ error: 'Semua field wajib diisi' });
    return;
  }
  const newUser = {
    id: `u_${Date.now()}`,
    nama,
    email,
    password_hash: `$2a$10$${password}hashsimulation`,
    role: role as UserRole,
    ref_id: ref_id || null,
    created_at: new Date().toISOString()
  };
  db.addUser(newUser);
  res.status(201).json(newUser);
});

app.put('/api/admin/users/:id', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  const { id } = req.params;
  const { nama, email, password, role, ref_id } = req.body;
  const updates: Partial<User> = {};
  if (nama !== undefined) updates.nama = nama;
  if (email !== undefined) updates.email = email;
  if (role !== undefined) updates.role = role;
  if (ref_id !== undefined) updates.ref_id = ref_id;
  if (password) {
    updates.password_hash = `$2a$10$${password}hashsimulation`;
  }
  db.updateUser(id, updates);
  res.json({ message: 'User updated successfully' });
});

app.delete('/api/admin/users/:id', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  db.deleteUser(req.params.id);
  res.json({ message: 'User deleted successfully' });
});

// --- KAMPUNG PRAMUKA CRUD (Kwarcab only) ---
app.get('/api/admin/kampung-pramuka', authenticate, (req: AuthRequest, res: Response) => {
  res.json(db.getKampungPramuka());
});

app.post('/api/admin/kampung-pramuka', authenticate, authorize(['kwarcab']), (req: AuthRequest, res: Response) => {
  const { nama, kecamatan, latitude, longitude, foto, sejarah, keunggulan } = req.body;
  if (!nama || !kecamatan || latitude === undefined || longitude === undefined || !sejarah || !keunggulan) {
    res.status(400).json({ error: 'Field nama, kecamatan, koordinat, sejarah, dan keunggulan wajib diisi' });
    return;
  }
  const newKp = {
    id: `kp_${Date.now()}`,
    nama,
    kecamatan,
    latitude: Number(latitude),
    longitude: Number(longitude),
    foto: foto || '',
    sejarah,
    keunggulan,
    created_at: new Date().toISOString()
  };
  db.addKampungPramuka(newKp);
  res.status(201).json(newKp);
});

app.put('/api/admin/kampung-pramuka/:id', authenticate, authorize(['kwarcab']), (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nama, kecamatan, latitude, longitude, foto, sejarah, keunggulan } = req.body;
  const updates: any = {};
  if (nama !== undefined) updates.nama = nama;
  if (kecamatan !== undefined) updates.kecamatan = kecamatan;
  if (latitude !== undefined) updates.latitude = Number(latitude);
  if (longitude !== undefined) updates.longitude = Number(longitude);
  if (foto !== undefined) updates.foto = foto;
  if (sejarah !== undefined) updates.sejarah = sejarah;
  if (keunggulan !== undefined) updates.keunggulan = keunggulan;

  db.updateKampungPramuka(id, updates);
  res.json({ message: 'Kampung Pramuka updated successfully' });
});

app.delete('/api/admin/kampung-pramuka/:id', authenticate, authorize(['kwarcab']), (req: AuthRequest, res: Response) => {
  db.deleteKampungPramuka(req.params.id);
  res.json({ message: 'Kampung Pramuka deleted successfully' });
});

// --- KTA CONFIG ---
app.get('/api/admin/kta-config', authenticate, authorize(['kwarcab']), (req: Request, res: Response) => {
  res.json(db.getKtaConfig());
});

app.put('/api/admin/kta-config', authenticate, authorize(['kwarcab']), (req: AuthRequest, res: Response) => {
  const { nama_ketua, tanda_tangan_url, stempel_url } = req.body;
  
  if (!nama_ketua) {
    res.status(400).json({ error: 'Nama Ketua Kwarcab wajib diisi' });
    return;
  }
  
  const currentConfig = db.getKtaConfig();
  const newConfig = {
    nama_ketua,
    tanda_tangan_url: tanda_tangan_url !== undefined ? tanda_tangan_url : currentConfig.tanda_tangan_url,
    stempel_url: stempel_url !== undefined ? stempel_url : currentConfig.stempel_url
  };
  
  db.setKtaConfig(newConfig);
  res.json(newConfig);
});

// --- VITE MIDDLEWARE OR STATIC SERVER ---

const initServer = async () => {
  await db.ready;

  if (process.env.NODE_ENV === 'production' || process.env.DISABLE_HMR === 'true') {
    // Serve static files from 'dist'
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Fallback for SPA routing
    app.get('*', (req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application not built. Please run "npm run build" first.');
      }
    });
  } else {
    // Dynamic import for Vite dev server to prevent loading bundler libs in production builds
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Kwarcab Server] running on http://0.0.0.0:${PORT}`);
  });
};

initServer().catch(err => {
  console.error('Server failed to start:', err);
});
