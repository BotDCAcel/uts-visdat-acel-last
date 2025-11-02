// --- Fungsi Helper untuk Format Angka ---

/**
 * Memformat angka dengan pemisah ribuan.
 * (Fungsi formatCurrency dihapus karena tidak lagi digunakan)
 * Contoh: 1500 -> "1.500"
 * @param {number} value - Angka yang akan diformat
 * @returns {string} String angka yang telah diformat
 */
function formatNumber(value) {
    return new Intl.NumberFormat('id-ID').format(value);
}

// --- Fungsi Dashboard Utama ---

/**
 * Fungsi untuk mengambil data dari file JSON
 * @param {string} url - Path ke file JSON
 * @returns {Promise<Object>} Data JSON
 */
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Gagal memuat data dari ${url} (Status: ${response.status})`);
        }
        return response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        // Hapus referensi ke elemen KPI yang sudah tidak ada
        throw error; // Melempar error lagi agar createDashboard berhenti
    }
}

/**
 * (Fungsi updateKPIs dihapus karena elemen HTML-nya tidak ada)
 */

/**
 * Fungsi utama untuk membuat semua chart dashboard
 */
async function createDashboard() {
    try {
        // 1. Ambil semua data secara paralel
        // Hapus 'kpi_data.json' dari Promise.all
        const [salesData, categoriesData, paymentData] = await Promise.all([
            fetchData('sales_over_time.json'),
            fetchData('top_categories.json'),
            fetchData('payment_distribution.json')
        ]);

        // 2. (Panggilan ke updateKPIs dihapus)

        // --- 3. Line Chart: Pendapatan Bulanan ---
        const salesLabels = salesData.map(d => d.month);
        const salesValues = salesData.map(d => d.revenue);

        new Chart(document.getElementById('salesOverTimeChart'), {
            type: 'line',
            data: {
                labels: salesLabels,
                datasets: [{
                    label: 'Pendapatan (Rp)',
                    data: salesValues,
                    borderColor: 'rgb(22, 163, 74)',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Penting untuk container responsif
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Pendapatan (Rp)' },
                        ticks: {
                            callback: function(value) {
                                // Format Y-axis (Rp 1 Jt, Rp 2 Jt)
                                return 'Rp ' + (value / 1000000) + ' Jt';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.raw);
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // --- 4. Bar Chart: Kategori Teratas ---
        const categoryLabels = categoriesData.map(d => d.category);
        const categoryValues = categoriesData.map(d => d.revenue_mil); 

        new Chart(document.getElementById('topCategoriesChart'), {
            type: 'bar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Revenue (Jutaan Rp)',
                    data: categoryValues,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)', 
                    borderColor: 'rgb(37, 99, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Membuat Bar Chart Horizontal
                responsive: true,
                maintainAspectRatio: false, // Penting untuk container responsif
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: 'Revenue (Jutaan Rp)' }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` Revenue: ${context.raw.toLocaleString('id-ID')} Juta Rp`;
                            }
                        }
                    }
                }
            }
        });

        // --- 5. Doughnut Chart: Distribusi Pembayaran ---
        const paymentLabels = paymentData.map(d => d.payment_method);
        const paymentValues = paymentData.map(d => d.order_count);
        
        const paymentColors = [
            '#ef4444', // red-500
            '#f97316', // orange-500
            '#eab308', // yellow-500
            '#22c55e', // green-500
            '#3b82f6', // blue-500
            '#a855f7', // purple-500
        ];

        new Chart(document.getElementById('paymentDistributionChart'), {
            type: 'doughnut',
            data: {
                labels: paymentLabels,
                datasets: [{
                    label: 'Jumlah Pesanan',
                    data: paymentValues,
                    backgroundColor: paymentColors,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Penting untuk container responsif
                plugins: {
                    legend: {
                        position: 'bottom', // Legenda di bawah agar lebih rapi
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const currentValue = context.raw;
                                const percentage = ((currentValue / total) * 100).toFixed(1);
                                return ` ${context.label}: ${formatNumber(currentValue)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Terjadi kesalahan saat membuat dashboard:', error);
        // Tampilkan pesan error di body jika gagal total
        document.querySelector('.container').innerHTML = `<h2 class="text-center text-red-600 font-bold">Gagal memuat data dashboard. Pastikan file JSON (sales_over_time.json, dll.) tersedia dan coba lagi. Periksa konsol browser untuk detail.</h2>`;
    }
}

// Jalankan fungsi utama saat DOM siap
document.addEventListener('DOMContentLoaded', createDashboard);
