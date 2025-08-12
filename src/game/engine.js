const canvas = document.createElement('canvas');
const context = canvas.getContext('webgl');

document.body.appendChild(canvas);

let objects = [];
let lastTime = 0;

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    update(deltaTime);
    render();

    requestAnimationFrame(gameLoop);
}

function update(deltaTime) {
    // Update game objects and physics here
    objects.forEach(object => {
        object.update(deltaTime);
    });
}

function render() {
    context.clearColor(0.1, 0.1, 0.1, 1.0);
    context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);

    // Render game objects here
    objects.forEach(object => {
        object.render(context);
    });
}

function addObject(object) {
    objects.push(object);
}

init();