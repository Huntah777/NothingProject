class HiddenMessageRevealer {
    constructor() {
        this.tileSize = 10; // px
        this.gridContainer = document.getElementById('grid-container');
        this.overlay = document.getElementById('overlay');
        this.tiles = [];
        this.isFirstMove = true;
        this.rafId = null;
        this.resizeTimeout = null;

        this.init();
    }

    init() {
        this.buildGrid();
        this.rasterizeTextPattern();
        this.addEventListeners();
    }

    buildGrid() {
        // Clear previous grid
        this.gridContainer.innerHTML = '';
        this.tiles.length = 0;

        this.cols = Math.ceil(window.innerWidth / this.tileSize);
        this.rows = Math.ceil(window.innerHeight / this.tileSize);

        // Configure CSS Grid
        this.gridContainer.style.gridTemplateColumns = `repeat(${this.cols}, ${this.tileSize}px)`;
        this.gridContainer.style.gridTemplateRows = `repeat(${this.rows}, ${this.tileSize}px)`;

        // Populate grid with tiles
        for (let r = 0; r < this.rows; r++) {
            const rowArr = [];
            for (let c = 0; c < this.cols; c++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.setAttribute('role', 'presentation');
                tile.dataset.pattern = 'false';
                this.gridContainer.appendChild(tile);
                rowArr.push(tile);
            }
            this.tiles.push(rowArr);
        }
    }

    rasterizeTextPattern() {
        // Create an off-screen canvas at pixel resolution equal to grid * tileSize
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const canvasWidth = this.cols * this.tileSize;
        const canvasHeight = this.rows * this.tileSize;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 140px monospace'; // as per instructions
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        const text = 'Hello, Nothing';
        ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

        const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight).data;

        // Determine pattern tiles by sampling center pixel of each tile
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const sampleX = Math.floor(c * this.tileSize + this.tileSize / 2);
                const sampleY = Math.floor(r * this.tileSize + this.tileSize / 2);
                const idx = (sampleY * canvasWidth + sampleX) * 4;
                const alpha = imgData[idx + 3];
                if (alpha > 0) {
                    this.tiles[r][c].dataset.pattern = 'true';
                }
            }
        }
    }

    addEventListeners() {
        // Pointer move (mouse, pen, touch converted by browsers)
        document.addEventListener('pointermove', (e) => {
            this.revealTileAt(e.clientX, e.clientY);
        });

        // // Touchmove to prevent scroll (already covered by pointer events for reveal)
        // document.addEventListener('touchmove', (e) => {
        //     e.preventDefault();
        // }, { passive: false });

        // Resize handling
        window.addEventListener('resize', () => this.debouncedResize());
    }

    revealTileAt(x, y) {
        // Hide overlay on first interaction
        if (this.isFirstMove) {
            this.isFirstMove = false;
            this.overlay.classList.add('hidden');
        }

        const el = document.elementFromPoint(x, y);
        if (el && el.classList.contains('tile')) {
            if (el.dataset.pattern === 'true' && !el.classList.contains('revealed')) {
                el.classList.add('revealed');
            }
        }
    }

    debouncedResize() {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = setTimeout(() => this.reset(), 200);
    }

    reset() {
        this.isFirstMove = true;
        this.overlay.classList.remove('hidden');
        this.buildGrid();
        this.rasterizeTextPattern();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new HiddenMessageRevealer();
});