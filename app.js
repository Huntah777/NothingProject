class HiddenMessageRevealer {
    constructor() {
        this.calculateTileSize();
        this.gridContainer = document.getElementById('grid-container');
        this.overlay = document.getElementById('overlay');
        this.tiles = [];
        this.isFirstMove = true;
        this.rafId = null;
        this.resizeTimeout = null;
        this.touchTimeout = null;
        this.init();
    }

    calculateTileSize() {
        // Responsive tile size calculation
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        if (screenWidth <= 480) {
            // Small mobile phones
            this.tileSize = 4;
        } else if (screenWidth <= 768) {
            // Tablets and larger phones
            this.tileSize = 6;
        } else if (screenWidth <= 1024) {
            // Small desktops/tablets
            this.tileSize = 8;
        } else {
            // Large screens
            this.tileSize = 10;
        }
        
        // Ensure we have reasonable grid dimensions
        this.cols = Math.ceil(screenWidth / this.tileSize);
        this.rows = Math.ceil(screenHeight / this.tileSize);
        
        // Cap maximum grid size for performance
        if (this.cols > 200) {
            this.tileSize = Math.ceil(screenWidth / 200);
            this.cols = Math.ceil(screenWidth / this.tileSize);
        }
        if (this.rows > 150) {
            this.tileSize = Math.max(this.tileSize, Math.ceil(screenHeight / 150));
            this.rows = Math.ceil(screenHeight / this.tileSize);
        }
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
        
        this.calculateTileSize();
        
        // Configure CSS Grid with responsive sizing
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

        // Responsive font sizing
        const baseFontSize = Math.min(canvasWidth, canvasHeight) * 0.1;
        const responsiveFontSize = Math.max(40, Math.min(baseFontSize, 140));

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${responsiveFontSize}px monospace`;
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
            e.preventDefault();
            this.revealTileAt(e.clientX, e.clientY);
        });

        // Touch-specific events for better mobile experience
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.revealTileAt(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.revealTileAt(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        // Resize handling with debounce
        window.addEventListener('resize', () => this.debouncedResize());
        
        // Orientation change handling
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.debouncedResize(), 100);
        });
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
