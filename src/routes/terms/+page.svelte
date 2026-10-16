<script>
	import LegalPage from '#lib/components/LegalPage.svelte';
	const CONTACT = 'harlicuan@gmail.com';
</script>

<svelte:head>
	<title>Syarat Penggunaan · Retwepo</title>
	<meta name="description" content="Syarat dan ketentuan penggunaan Retwepo." />
</svelte:head>

<LegalPage title="Syarat Penggunaan" updated="16 Oktober 2026">
	<p>Dengan masuk dan menggunakan Retwepo, Anda menyetujui syarat berikut.</p>

	<section>
		<h2>1. Akun</h2>
		<ul>
			<li>Masuk menggunakan akun Google milik Anda sendiri; satu orang satu akun.</li>
			<li>Pendaftaran dan setiap akun media sosial yang Anda ajukan diverifikasi oleh admin. Admin berhak menyetujui atau menolak dengan alasan.</li>
			<li>Anda hanya boleh mendaftarkan akun media sosial yang Anda miliki atau kelola. Satu akun media sosial hanya dapat didaftarkan oleh satu pengguna.</li>
			<li>Anda bertanggung jawab atas kebenaran data, termasuk nomor e-wallet yang digunakan untuk pembayaran.</li>
		</ul>
	</section>

	<section>
		<h2>2. Rekap</h2>
		<ul>
			<li>Setiap rekap wajib menyertakan bukti berupa URL dan/atau screenshot yang asli dan sesuai dengan postingan atau panel yang Anda buat.</li>
			<li>Perubahan rekap wajib disertai alasan dan tercatat dalam riwayat yang dapat dilihat admin.</li>
			<li>Rekap duplikat, palsu, atau tidak sesuai bukti dapat dihapus admin dan tidak dihitung.</li>
		</ul>
	</section>

	<section>
		<h2>3. Larangan</h2>
		<ul>
			<li>Memalsukan bukti, merekap postingan milik orang lain, atau mengunggah konten yang melanggar hukum.</li>
			<li>Mencoba mengakses data pengguna lain atau mengganggu jalannya layanan.</li>
		</ul>
		<p class="mt-2">Pelanggaran dapat mengakibatkan rekap dihapus atau akun ditangguhkan.</p>
	</section>

	<section>
		<h2>4. Pembayaran</h2>
		<p>Ketentuan nilai dan jadwal pembayaran ditetapkan dan diinformasikan oleh admin di luar aplikasi ini. Jumlah rekap yang dihitung adalah rekap aktif yang tidak dihapus admin.</p>
	</section>

	<section>
		<h2>5. Perubahan dan penghentian</h2>
		<p>Kami dapat mengubah syarat ini atau menghentikan layanan sewaktu-waktu. Perubahan berlaku sejak dipublikasikan di halaman ini.</p>
	</section>

	<section>
		<h2>6. Kontak</h2>
		<p>Hubungi <a href="mailto:{CONTACT}">{CONTACT}</a> untuk pertanyaan seputar syarat penggunaan.</p>
	</section>
</LegalPage>
