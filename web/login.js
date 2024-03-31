const sampul = document.querySelector('.sampul');
const loginlink = document.querySelector('.login-link');
const regislink = document.querySelector('.regis-link');

regislink.addEventListener('click', () => {
    sampul
        .classList
        .add('active');
});
loginlink.addEventListener('click', () => {
    sampul
        .classList
        .remove('active');
});