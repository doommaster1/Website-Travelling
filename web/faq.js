var app = angular.module('pertanyaan', []);
app.controller('controller', function ($scope) {
    $scope.trains = [
        {
            question: 'Apa saja destinasi yang disediakan?',
            answer: 'Untuk destinasi yang disediakan dapat dilihat di bagian destination di homepag' +
                    'e'
        }, {
            question: 'Apakah ada restoran atau makanan khas yang harus saya coba di Tokyo?',
            answer: 'Salah satu restoran yang wajib di coba di Tokyo adalah Narisawa, sebuah restor' +
                    'an populer milik koki terkenal Yoshihiro Narisawa. Menu disajikan dengan gaya ' +
                    'omakase (yang berarti “sesuka hati Anda”) sehingga membuat anda mendapatkan pe' +
                    'ngalaman khas Jepang.'
        }, {
            question: 'Bagaimana kondisi cuaca di destinasi London saat ini atau dalam beberapa hari ' +
                    'ke depan?',
            answer: 'Menurut update cuaca di Website google weather untuk Kondisi cuaca saat ini da' +
                    'n prakiraan untuk beberapa hari mendatang di London adalah cerah.'
        }, {
            question: 'Bagaimana dengan keamanan dan keselamatan di destinasi ini, apakah ada hal-hal' +
                    ' yang perlu diperhatikan?',
            answer: 'Beberapa hal penting yang harus diperhatikan pada saat traveling diantaranya y' +
                    'aitu pahami peraturan dan budaya lokal disana, selalu awasi barang-barang Anda' +
                    ', terutama di tempat-tempat ramai, simpan barang berharga seperti paspor, uang' +
                    ', dan kartu kredit di tempat yang aman dan lain sebagainya.'
        }, {
            question: 'Apakah ada saran transportasi lokal yang efisien untuk menjelajahi destinasi i' +
                    'ni?',
            answer: 'Prancis'
        }, {
            question: 'Bagaimana dengan kebijakan pembatalan atau pengembalian uang untuk reservasi a' +
                    'komodasi atau tur?',
            answer: 'Pada saat ini, kami tidak menyediakan layanan pembatalan atau pengembalian uan' +
                    'g untuk reservasi akomodasi atau tur. Kami mohon maaf atas ketidaknyamanannya ' +
                    'dan kami senantiasa berusaha memberikan pengalaman yang memuaskan kepada pelan' +
                    'ggan kami.'
        }, {
            question: 'Apakah bulan ini ada festival atau acara khusus yang akan berlangsung di Madri' +
                    'd, Spanyol',
            answer: 'Di bulan ini, Madrid memiliki beberapa festival dan acara yang menarik. Salah ' +
                    'satunya adalah Madrid Carnival biasanya diadakan pada akhir Februari atau awal' +
                    ' Maret. Untuk informasi lebih lanjut tentang acara-acara yang berlangsung sela' +
                    'ma bulan ini, disarankan untuk memeriksa situs web resmi pariwisata Madrid ata' +
                    'u kalender acara lokal.'
        }
    ];

    // Initialize showing all FAQs
    $scope.hasil = $scope.trains;
    $scope.showNoResultsMessage = false;

    $scope.search = function () {
        var searchTerms = $scope
            .searchName
            .toLowerCase()
            .split(' ');

        var isWhitespaceSearch = searchTerms.every(function (term) {
            return term.trim() === '';
        });

        if (isWhitespaceSearch) {
            $scope.hasil = $scope.trains;
        } else {
            $scope.hasil = $scope
                .trains
                .filter(function (pertanyaan) {
                    var namaLowerCase = pertanyaan
                        .question
                        .toLowerCase();
                    return searchTerms.some(function (term) {
                        return namaLowerCase.includes(term);
                    });
                });
        }

        $scope.showNoResultsMessage = $scope.hasil.length === 0 && !isWhitespaceSearch;
    };
});