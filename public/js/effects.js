var bg = null;

// ========================================== Matrix Effect ========================================== \\
class Background {
    constructor() {
        // Canvas element
        this.c = document.getElementById("background");
        this.ctx = this.c.getContext("2d");

        this.matrix = "bitwse@#$%^&*()*&^%+-/~{[|`]}";
        this.matrix = this.matrix.split("");

        // Get color
        ReactDOM.render(<div id="accent" className={"ui" + accent + "button"}></div>, document.getElementById("background"));
        this.color = getComputedStyle(document.querySelector("#accent")).backgroundColor;
        ReactDOM.unmountComponentAtNode(document.getElementById("background"))

        // Get background
        ReactDOM.render(<div id="dark" className={"ui" + dark + "segment"}></div>, document.getElementById("background"));
        this.bgColor = getComputedStyle(document.querySelector("#dark")).backgroundColor;
        var match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(this.bgColor)
        this.background = "rgba(" + [match[1], match[2], match[3], 0.25].join(',') + ")";
        ReactDOM.unmountComponentAtNode(document.getElementById("background"))

        this.font_size = 10;
        this.delay = 100;

        this.drops = [];
        this.drawLoop = null;

        // Initial drop effect start
        this.resetEffects();
        this.clearLoop = setInterval(this.clear, 100000);

        // Allow user clicks to start drops
        this.c.addEventListener('mousedown', function (e) {
            const rect = c.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Cursor grid position
            var col = Math.floor(x / this.font_size + 0.2);
            var row = Math.ceil(y / this.font_size);

            this.drops[col] = row;
        })

        // Window resize should properly reset the drop columns
        window.addEventListener("resize", this.resetEffects, false);
    }

    resetEffects = () => {
        this.drops = [];

        this.c.height = window.innerHeight;
        this.c.width = window.innerWidth;

        this.ctx.clearRect(0, 0, this.c.width, this.c.height);
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);

        // Initialize drops above screen
        for (var x = 0; x < this.c.width / this.font_size; x++) {
            this.drops[x] = 0;
        }

        // Restart drop effect
        clearInterval(this.drawLoop);
        this.drawLoop = setInterval(this.draw, this.delay);
    }

    draw = () => {
        this.ctx.fillStyle = this.background;
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);

        this.ctx.fillStyle = this.color;
        this.ctx.font = this.font_size + "px Ubuntu Mono";

        for (var i = 0; i < this.drops.length; i++) {
            var text = this.matrix[Math.floor(Math.random() * this.matrix.length)];
            var x = i * this.font_size;
            var y = this.drops[i] * this.font_size;

            this.ctx.fillText(text, x, y);

            // Randomly restart drops
            if ((this.drops[i] < 0) && (Math.random() > 0.998)) {
                this.drops[i] = Math.floor(Math.random() * this.c.height / this.font_size);
            }

            // Lower drop
            this.drops[i]--;
        }
    }

    clear = () => {
        this.ctx.clearRect(0, 0, this.c.width, this.c.height);
        this.ctx.fillStyle = this.bgColor;
        this.ctx.fillRect(0, 0, this.c.width, this.c.height);
    }

    stop = () => {
        clearInterval(this.drawLoop);
        clearInterval(this.clearLoop);
        this.clear();
    }
}
