// ========================================== Matrix Effect ========================================== \\
function background() {
    // Canvas element
    var c = document.getElementById("background");
    var ctx = c.getContext("2d");

    var matrix = "bitwse@#$%^&*()*&^%+-/~{[|`]}";
    matrix = matrix.split("");

    // Get color
    ReactDOM.render(<div id="accent" className={"ui" + accent + "button"}></div>, document.getElementById("background"));
    var color = getComputedStyle(document.querySelector("#accent")).backgroundColor;
    ReactDOM.unmountComponentAtNode(document.getElementById("background"))

    // Get background
    ReactDOM.render(<div id="dark" className={"ui" + dark + "segment"}></div>, document.getElementById("background"));
    var bgColor = getComputedStyle(document.querySelector("#dark")).backgroundColor;
    var match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(bgColor)
    var background = "rgba(" + [match[1], match[2], match[3], 0.25].join(',') + ")";
    ReactDOM.unmountComponentAtNode(document.getElementById("background"))
    
    var font_size = 10;
    var delay = 100;

    var drops = [];

    // Initial drop effect start
    resetEffects();
    var loop = setInterval(draw, delay);
    setInterval(clear, 100000);

    // Allow user clicks to start drops
    c.addEventListener('mousedown', function (e) {
        const rect = c.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Cursor grid position
        var col = Math.floor(x / font_size + 0.2);
        var row = Math.ceil(y / font_size);

        drops[col] = row;
    })

    // Window resize should properly reset the drop columns
    window.addEventListener("resize", resetEffects, false);

    function resetEffects() {
        drops = [];

        c.height = window.innerHeight;
        c.width = window.innerWidth;

        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, c.width, c.height);

        // Initialize drops above screen
        for (var x = 0; x < c.width / font_size; x++) {
            drops[x] = 0;
        }

        // Restart drop effect
        clearInterval(loop);
        loop = setInterval(draw, delay);
    }

    function draw() {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, c.width, c.height);

        ctx.fillStyle = color;
        ctx.font = font_size + "px Ubuntu Mono";

        for (var i = 0; i < drops.length; i++) {
            var text = matrix[Math.floor(Math.random() * matrix.length)];
            var x = i * font_size;
            var y = drops[i] * font_size;

            ctx.fillText(text, x, y);

            // Randomly restart drops
            if ((drops[i] < 0) && (Math.random() > 0.998)) {
                drops[i] = Math.floor(Math.random() * c.height / font_size);
            }

            // Lower drop
            drops[i]--;
        }
    }

    function clear() {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, c.width, c.height);
    }
}
