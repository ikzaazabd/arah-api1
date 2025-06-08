const fs = require('fs').promises;
const { parse } = require('csv-parse/sync');

// Array untuk menyimpan data di memori
let dataStore = []; // Hanya untuk data dari Postman
let csvData = []; // Hanya untuk data CSV

// Fungsi untuk memuat data awal dari CSV
const loadInitialData = async () => {
    try {
        const fileContent = await fs.readFile('./data/data_hasil.csv');
        const records = parse(fileContent, { columns: true, trim: true });
        csvData = records.map(row => ({
            id: String(row.id),
            Bahasa_Indonesia: parseFloat(row.Bahasa_Indonesia) || 0,
            Bahasa_Inggris: parseFloat(row.Bahasa_Inggris) || 0,
            Matematika: parseFloat(row.Matematika) || 0,
            Fisika: parseFloat(row.Fisika) || 0,
            Biologi: parseFloat(row.Biologi) || 0,
            Seni: parseFloat(row.Seni) || 0,
            Geografi: parseFloat(row.Geografi) || 0,
            Sejarah: parseFloat(row.Sejarah) || 0,
            Pendidikan_Jasmani: parseFloat(row.Pendidikan_Jasmani) || 0,
            Kewirausahaan: parseFloat(row.Kewirausahaan) || 0,
            Ekonomi: parseFloat(row.Ekonomi) || 0,
            MBTI: row.MBTI || '',
            Hobi: row.Hobi || '',
            Gaya_Belajar: row.Gaya_Belajar || '',
            Jurusan_Kuliah: row['Jurusan Kuliah'] || row.Jurusan_Kuliah || ''
        }));
        // console.log('Data dari CSV dimuat ke csvData:', csvData);
    } catch (error) {
        throw new Error('Gagal membaca file CSV: ' + error.message);
    }
};

// Panggil fungsi untuk memuat data saat server start
loadInitialData();

// Fungsi untuk mencocokkan input dengan data CSV
const getRecommendation = (input) => {
    const subjects = [
        'Bahasa_Indonesia', 'Bahasa_Inggris', 'Matematika', 'Fisika', 'Biologi',
        'Seni', 'Geografi', 'Sejarah', 'Pendidikan_Jasmani', 'Kewirausahaan', 'Ekonomi'
    ];
    const attributes = ['MBTI', 'Hobi', 'Gaya_Belajar'];

    const inputScores = subjects.reduce((acc, subject) => {
        acc[subject] = input[subject] || 0;
        return acc;
    }, {});

    const inputAttributes = attributes.reduce((acc, attr) => {
        acc[attr] = input[attr] || '';
        return acc;
    }, {});

    let closestMatch = null;
    let minDistance = Infinity;

    for (const record of csvData) {
        let distance = 0;

        // Hitung jarak untuk mata pelajaran (numerik)
        for (const subject of subjects) {
            const inputScore = inputScores[subject] || 0;
            const recordScore = parseFloat(record[subject]) || 0;
            distance += Math.pow(inputScore - recordScore, 2);
        }

        // Tambahkan penalti untuk atribut non-numerik (MBTI, Hobi, Gaya_Belajar)
        for (const attr of attributes) {
            const inputAttr = inputAttributes[attr].toLowerCase();
            const recordAttr = record[attr].toLowerCase();
            distance += inputAttr === recordAttr ? 0 : 100; // Penalti jika tidak cocok
        }

        distance = Math.sqrt(distance);
        if (distance < minDistance) {
            minDistance = distance;
            closestMatch = record;
        }
    }

    return {
        Jurusan_Kuliah: closestMatch.Jurusan_Kuliah || ''
    };
};

module.exports = {
    // GET: Mendapatkan hanya data yang ditambahkan via Postman
    getAll: async (request, h) => {
        try {
            const postmanData = dataStore.filter(item => item.isFromPostman);
            return h.response(postmanData).code(200);
        } catch (error) {
            return h.response({ error: error.message }).code(500);
        }
    },

    // GET: Mendapatkan data berdasarkan ID
    getById: async (request, h) => {
        try {
            const item = dataStore.find(row => row.id === request.params.id && row.isFromPostman);
            if (!item) {
                return h.response({ error: 'Data tidak ditemukan' }).code(404);
            }
            return h.response(item).code(200);
        } catch (error) {
            return h.response({ error: error.message }).code(500);
        }
    },

    // POST: Menambahkan data baru dengan nama, mata pelajaran, MBTI, Hobi, Gaya_Belajar, dan rekomendasi
    create: async (request, h) => {
        try {
            const { nama, MBTI, Hobi, Gaya_Belajar, ...subjects } = request.payload;
            if (!nama) {
                return h.response({ error: 'Nama wajib diisi' }).code(400);
            }

            // Dapatkan rekomendasi berdasarkan input
            const recommendation = getRecommendation({ ...subjects, MBTI, Hobi, Gaya_Belajar });

            // Buat ID unik untuk data baru
            const newItem = {
                id: String(dataStore.length + 1),
                nama,
                ...subjects,
                MBTI: MBTI || '',
                Hobi: Hobi || '',
                Gaya_Belajar: Gaya_Belajar || '',
                ...recommendation,
                isFromPostman: true
            };

            dataStore.push(newItem);
            console.log('New Item Created:', newItem); // Debugging
            return h.response({
                message: 'Data berhasil ditambahkan',
                data: newItem
            }).code(201);
        } catch (error) {
            return h.response({ error: error.message }).code(500);
        }
    },

    // PUT: Memperbarui data berdasarkan ID
    update: async (request, h) => {
        try {
            const index = dataStore.findIndex(row => row.id === request.params.id && row.isFromPostman);
            if (index === -1) {
                return h.response({ error: 'Data tidak ditemukan' }).code(404);
            }

            const { nama, MBTI, Hobi, Gaya_Belajar, ...subjects } = request.payload;
            const recommendation = getRecommendation({ ...subjects, MBTI, Hobi, Gaya_Belajar });

            dataStore[index] = {
                ...dataStore[index],
                nama,
                ...subjects,
                MBTI: MBTI || '',
                Hobi: Hobi || '',
                Gaya_Belajar: Gaya_Belajar || '',
                ...recommendation,
                isFromPostman: true
            };

            return h.response({
                message: 'Data berhasil diperbarui',
                data: dataStore[index]
            }).code(200);
        } catch (error) {
            return h.response({ error: error.message }).code(500);
        }
    },

    // DELETE: Menghapus data berdasarkan ID
delete: async (request, h) => {
    try {
        const { id } = request.params;
        const itemIndex = dataStore.findIndex(row => row.id === id);

        if (itemIndex > -1) {
            dataStore.splice(itemIndex, 1);
            console.log(`Data dengan ID ${id} berhasil dihapus dari memori server.`);
        } else {
            console.log(`Data dengan ID ${id} tidak ditemukan di memori server, tapi proses dianggap sukses.`);
        }
        
        return h.response({ message: 'Permintaan hapus berhasil diproses' }).code(200);

    } catch (error) {
        return h.response({ error: error.message }).code(500);
    }
    }
}