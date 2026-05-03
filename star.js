/* 星點粒子 */
const starfield = document.getElementById("starfield");
for (let i = 0; i < 120; i++) {
    const star = document.createElement("div");
    star.style.position = "absolute";
    star.style.width = "2px";
    star.style.height = "2px";
    star.style.background = "white";
    star.style.opacity = Math.random();
    star.style.top = Math.random() * 100 + "%";
    star.style.left = Math.random() * 100 + "%";
    star.style.borderRadius = "50%";
    star.style.animation = `twinkle ${2 + Math.random() * 3}s infinite`;
    starfield.appendChild(star);
}

/* 星軌動畫 */
const canvas = document.getElementById("startrail");
const ctx = canvas.getContext("2d");

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.onresize = resize;

let angle = 0;

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = "rgba(212,175,55,0.25)";
    ctx.lineWidth = 0.6;

    ctx.beginPath();
    for (let i = 0; i < 200; i++) {
        const radius = i * 2;
        const x = canvas.width / 2 + Math.cos(angle + i * 0.02) * radius;
        const y = canvas.height / 2 + Math.sin(angle + i * 0.02) * radius;
        ctx.lineTo(x, y);
    }
    ctx.stroke();

    angle += 0.002;
    requestAnimationFrame(draw);
}
draw();
