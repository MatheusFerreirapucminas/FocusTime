// Menu
document.addEventListener("DOMContentLoaded", () => {
    const navLinks = document.querySelectorAll("nav a");
    const currentPage = window.location.pathname.split("/").pop();

    navLinks.forEach(link => {
        const href = link.getAttribute("href");
        if (href && href !== "#" && currentPage === href) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});

// Carrossel
const sliders = document.querySelectorAll('.slider');
const btnPrev = document.getElementById('prev-button');
const btnNext = document.getElementById('next-button');

let currentSlide = 0;

function hideSliders() {
    sliders.forEach(slide => slide.classList.remove('on'));
}

function showSlider() {
    sliders[currentSlide].classList.add('on');
}

function nextSlider() {
    hideSliders();
    currentSlide = (currentSlide + 1) % sliders.length;
    showSlider();
}

function prevSlider() {
    hideSliders();
    currentSlide = (currentSlide - 1 + sliders.length) % sliders.length;
    showSlider();
}

btnNext.addEventListener('click', nextSlider);
btnPrev.addEventListener('click', prevSlider);