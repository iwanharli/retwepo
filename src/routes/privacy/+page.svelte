<script>
	import LegalPage from '#lib/components/LegalPage.svelte';
	const CONTACT = 'harlicuan@gmail.com';
</script>

<svelte:head>
	<title>Kebijakan Privasi · Retwepo</title>
	<meta name="description" content="Kebijakan privasi Retwepo: data yang dikumpulkan, penggunaan, penyimpanan, dan hak pengguna." />
</svelte:head>

<LegalPage title="Kebijakan Privasi" updated="16 Oktober 2026">
	<p>
		Retwepo ("kami") adalah aplikasi untuk mencatat (merekap) postingan dan panel yang dibuat pengguna di akun media sosial
		mereka, untuk keperluan pemantauan aktivitas dan pembayaran. Kebijakan ini menjelaskan data apa yang kami kumpulkan,
		bagaimana data tersebut digunakan, dan hak Anda atas data tersebut.
	</p>

	<section>
		<h2>1. Data yang kami kumpulkan</h2>
		<ul>
			<li><b>Data akun Google</b> saat Anda masuk: alamat email, nama, foto profil, dan ID akun Google. Kami tidak menerima maupun menyimpan password Google Anda.</li>
			<li><b>Data pendaftaran</b>: nama panggilan, penyedia dan nomor e-wallet.</li>
			<li><b>Akun media sosial</b> yang Anda daftarkan: platform dan username.</li>
			<li><b>Rekap</b> yang Anda buat: URL postingan/panel, screenshot, catatan, waktu posting, serta riwayat perubahannya.</li>
			<li><b>Data teknis</b>: cookie sesi untuk menjaga Anda tetap masuk, dan alamat IP yang dipakai sementara untuk membatasi percobaan masuk berlebihan (tidak disimpan permanen).</li>
		</ul>
	</section>

	<section>
		<h2>2. Penggunaan data</h2>
		<ul>
			<li>Memverifikasi identitas Anda dan kepemilikan akun media sosial yang didaftarkan.</li>
			<li>Mencatat, menampilkan, dan menghitung rekap untuk statistik aktivitas.</li>
			<li>Memproses pembayaran ke nomor e-wallet yang Anda daftarkan.</li>
			<li>Mengirim notifikasi di dalam aplikasi terkait akun dan rekap Anda.</li>
			<li>Menjaga keamanan layanan dan mencegah penyalahgunaan.</li>
		</ul>
		<p class="mt-2">Kami tidak menjual data Anda dan tidak menggunakannya untuk iklan.</p>
	</section>

	<section>
		<h2>3. Siapa yang dapat melihat data Anda</h2>
		<p>
			Data Anda hanya dapat dilihat oleh Anda sendiri dan admin Retwepo yang bertugas memverifikasi pendaftaran, memantau
			rekap, dan memproses pembayaran. Screenshot rekap hanya dapat dibuka oleh pemiliknya dan admin. Kami tidak membagikan
			data kepada pihak ketiga, kecuali bila diwajibkan oleh hukum.
		</p>
	</section>

	<section>
		<h2>4. Penyimpanan dan lama penyimpanan</h2>
		<ul>
			<li>Data disimpan di server kami dan dilindungi dengan koneksi terenkripsi (HTTPS).</li>
			<li>Rekap yang dihapus admin disimpan selama 90 hari agar Anda dapat melihat alasannya, lalu dihapus permanen beserta screenshot-nya.</li>
			<li>Salinan cadangan (backup) disimpan maksimal 7 hari untuk pemulihan bila terjadi gangguan.</li>
			<li>Data akun disimpan selama akun Anda aktif atau sampai Anda meminta penghapusan.</li>
		</ul>
	</section>

	<section>
		<h2>5. Hak Anda</h2>
		<ul>
			<li>Melihat dan memperbarui nama panggilan serta e-wallet Anda melalui halaman Profil.</li>
			<li>Mengedit rekap Anda sendiri.</li>
			<li>Meminta salinan atau penghapusan data akun Anda dengan menghubungi kami.</li>
			<li>Mencabut akses Retwepo ke akun Google Anda kapan saja melalui <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">pengaturan akun Google</a>.</li>
		</ul>
	</section>

	<section>
		<h2>6. Perubahan kebijakan</h2>
		<p>Kebijakan ini dapat diperbarui sewaktu-waktu. Tanggal pembaruan terakhir tercantum di bagian atas halaman ini.</p>
	</section>

	<section>
		<h2>7. Kontak</h2>
		<p>Pertanyaan atau permintaan terkait data Anda dapat dikirim ke <a href="mailto:{CONTACT}">{CONTACT}</a>.</p>
	</section>
</LegalPage>
