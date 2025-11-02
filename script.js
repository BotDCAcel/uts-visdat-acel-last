// Fungsi untuk mengambil data dari file JSON
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Gagal memuat data dari ${url}`);
    }
    return response.json();
}

// Fungsi utama untuk membuat dashboard
async function createDashboard() {
    try {
        // 1. Ambil semua data
        const salesData = await fetchData('sales_over_time.json');
        const categoriesData = await fetchData('top_categories.json');
        const paymentData = await fetchData('payment_distribution.json');

        // --- 1. Line Chart: Pendapatan Bulanan ---
        const salesLabels = salesData.map(d => d.month);
        const salesValues = salesData.map(d => d.revenue);

        new Chart(document.getElementById('salesOverTimeChart'), {
            type: 'line',
            data: {
                labels: salesLabels,
                datasets: [{
                    label: 'Pendapatan (Rp)',
                    data: salesValues,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Pendapatan (Rp)'
                        },
                        // Menggunakan fungsi callback untuk memformat label sumbu Y
                        ticks: {
                            callback: function(value, index, values) {
                                // Contoh: 1000000 -> 1 Jt
                                return 'Rp ' + (value / 1000000).toFixed(0) + ' Jt';
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

        // --- 2. Bar Chart: Kategori Teratas ---
        const categoryLabels = categoriesData.map(d => d.category);
        // Menggunakan kolom 'revenue_mil' untuk nilai yang lebih mudah dibaca
        const categoryValues = categoriesData.map(d => d.revenue_mil); 

        new Chart(document.getElementById('topCategoriesChart'), {
            type: 'bar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Revenue (Jutaan Rp)',
                    data: categoryValues,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y', // Membuat Bar Chart Horizontal
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (Jutaan Rp)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += (context.raw).toLocaleString('id-ID') + ' Juta';
                                return label;
                            }
                        }
                    }
                }
            }
        });

        // --- 3. Doughnut Chart: Distribusi Pembayaran ---
        const paymentLabels = paymentData.map(d => d.payment_method);
        const paymentValues = paymentData.map(d => d.order_count);
        
        // Fungsi untuk menghasilkan warna acak
        const generateColors = (num) => {
            const colors = [];
            for (let i = 0; i < num; i++) {
                // Warna pastel acak
                colors.push(`hsl(${Math.random() * 360}, 70%, 75%)`);
            }
            return colors;
        };

        new Chart(document.getElementById('paymentDistributionChart'), {
            type: 'doughnut',
            data: {
                labels: paymentLabels,
                datasets: [{
                    label: 'Jumlah Pesanan',
                    data: paymentValues,
                    backgroundColor: generateColors(paymentValues.length),
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const currentValue = context.raw;
                                const percentage = ((currentValue / total) * 100).toFixed(1);
                                return `${context.label}: ${currentValue.toLocaleString('id-ID')} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Terjadi kesalahan saat membuat dashboard:', error);
        document.querySelector('.container').innerHTML = '<h2>Gagal memuat data. Periksa konsol browser untuk detail.</h2>';
    }
}

createDashboard();