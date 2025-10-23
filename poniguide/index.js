/* Código para o auto-scroll dos carrosséis do index.html */

document.addEventListener("DOMContentLoaded", function() {
            
    // Função genérica para auto-scroll
    function setupAutoScroll(carouselSelector, cardSelector, intervalTime = 3000) {
        const carousel = document.querySelector(carouselSelector);
        if (!carousel) return;

        let scrollInterval;

        function startScrolling() {
            scrollInterval = setInterval(function() {
                const card = carousel.querySelector(cardSelector);
                if (!card) return;

                const style = window.getComputedStyle(carousel);
                const gap = parseFloat(style.gap) || 15;
                const cardWidthWithGap = card.offsetWidth + gap;

                // Se o scroll + largura do carrossel for maior ou igual ao scroll total, volta ao início
                if (carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - (gap + 5)) {
                    carousel.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    // Rola para o próximo card
                    carousel.scrollBy({ left: cardWidthWithGap, behavior: 'smooth' });
                }
            }, intervalTime); // Tempo para trocar de card (3 segundos)
        }

        function stopScrolling() {
            clearInterval(scrollInterval);
        }

        // Inicia o scroll
        startScrolling();

        // Pausa o scroll quando o mouse estiver em cima
        carousel.addEventListener('mouseenter', stopScrolling);
        // Retoma o scroll quando o mouse sair
        carousel.addEventListener('mouseleave', startScrolling);
    }

    // Aplica a função aos dois carrosséis
    setupAutoScroll('.carousel-guia', '.guia-card');
    setupAutoScroll('.carousel-dicas', '.dica-card');
});