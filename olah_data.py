import pandas as pd
import numpy as np
import json

# Muat data
# Ganti "data_tokped.csv" jika nama file Anda berbeda
try:
    df = pd.read_csv("data_tokped.csv")
except FileNotFoundError:
    print("Error: File 'data_tokped.csv' tidak ditemukan.")
    print("Pastikan file data Anda berada di folder yang sama dengan script Python ini.")
    exit()

# 1. Filter pesanan yang valid
# Asumsi 'is_valid' == 1 adalah pesanan yang valid
df_valid = df[df['is_valid'] == 1].copy()

# 2. Konversi kolom tanggal ke format datetime
df_valid['order_date'] = pd.to_datetime(df_valid['order_date'])

# --- Data untuk Dashboard ---

# 3. Penjualan dari Waktu ke Waktu (Revenue Bulanan)
print("Memproses: Penjualan dari Waktu ke Waktu...")
df_valid['order_month'] = df_valid['order_date'].dt.to_period('M')
sales_over_time = df_valid.groupby('order_month')['after_discount'].sum().reset_index()
sales_over_time['order_month'] = sales_over_time['order_month'].astype(str) # Konversi Period ke string
sales_over_time.columns = ['month', 'revenue']
# Simpan sebagai JSON
sales_over_time.to_json('sales_over_time.json', orient='records')

# 4. Kategori Teratas (Total Revenue)
print("Memproses: Kategori Teratas...")
top_categories = df_valid.groupby('category')['after_discount'].sum().sort_values(ascending=False).reset_index()
top_categories.columns = ['category', 'revenue']
# Konversi pendapatan ke format jutaan untuk label yang lebih ringkas
top_categories['revenue_mil'] = (top_categories['revenue'] / 1_000_000).round(2)
top_categories = top_categories.head(10) # Ambil 10 teratas
# Simpan sebagai JSON
top_categories.to_json('top_categories.json', orient='records')

# 5. Distribusi Metode Pembayaran (Top 5 + Lain-lain)
print("Memproses: Distribusi Metode Pembayaran (Top 5 + Lain-lain)...")
payment_counts = df_valid['payment_method'].value_counts()

# Tentukan jumlah N teratas
top_n = 5

if len(payment_counts) > top_n:
    # Ambil 5 metode teratas
    top_5 = payment_counts.head(top_n).copy() # Pakai .copy() untuk menghindari SettingWithCopyWarning
    
    # Hitung jumlah dari semua metode lainnya
    other_sum = payment_counts.iloc[top_n:].sum()
    
    # Tambahkan 'Lain-lain' ke dalam series
    # Cek dulu jika 'Lain-lain' sudah ada di 5 teratas (jarang, tapi mungkin)
    if 'Lain-lain' in top_5:
         top_5['Lain-lain'] += other_sum
         payment_distribution_final = top_5
    else:
        # Cara aman untuk menambahkan baris baru
        other_series = pd.Series([other_sum], index=['Lain-lain'])
        payment_distribution_final = pd.concat([top_5, other_series])
else:
    # Jika total metode 5 atau kurang, tampilkan semua
    payment_distribution_final = payment_counts

# Ubah kembali ke DataFrame dengan format yang benar
payment_distribution = payment_distribution_final.reset_index()
payment_distribution.columns = ['payment_method', 'order_count']

# Simpan sebagai JSON
payment_distribution.to_json('payment_distribution.json', orient='records')

print("\n--- Selesai ---")
print("Proses pengolahan data selesai. File JSON siap digunakan untuk dashboard web.")