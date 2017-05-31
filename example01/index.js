const mView = mat4.create();
const mMove = mat4.create();

let gl;
let shaderProgram;

const vertexShaderText = `
uniform mat4 umView;
uniform mat4 umMove;

attribute vec3 aPos;

void main(void) {
    gl_Position = umView * umMove * vec4(aPos, 1.0);
}
`;

const fragmentShaderText = `
precision mediump float;

void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

const triangle = {
    buffer:     null,
    points:     new Float32Array([
        0, 1, 0,
        -1, -1, 0,
        1, -1, 0,
    ]),
    itemSize:   3,
    itemsCount: 3,
};

const square = {
    buffer:     null,
    points:     new Float32Array([
        1, 1, 0,
        -1, 1, 0,
        1, -1, 0,
        -1, -1, 0,
    ]),
    itemSize:   3,
    itemsCount: 4,
};

function initGL(canvas) {
    gl                = canvas.getContext('webgl');
    gl.viewportWidth  = canvas.width;
    gl.viewportHeight = canvas.height;
}

function makeShader(gl, type, shaderCode) {
    const shader = gl.createShader(type);

    gl.shaderSource(shader, shaderCode);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(shader));
        throw new Error('Shader error');
    }

    return shader;
}

function initShaderProgram() {
    const vertexShader   = makeShader(gl, gl.VERTEX_SHADER, vertexShaderText);
    const fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Could not initialize shader program');
        throw new Error('Shader program failed');
    }

    gl.useProgram(shaderProgram);

    shaderProgram.umView = gl.getUniformLocation(shaderProgram, 'umView');
    shaderProgram.umMove = gl.getUniformLocation(shaderProgram, 'umMove');
    shaderProgram.aPos   = gl.getAttribLocation(shaderProgram, 'aPos');

    gl.enableVertexAttribArray(shaderProgram.aPos);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.umView, false, mView);
    gl.uniformMatrix4fv(shaderProgram.umMove, false, mMove);
}

function initBuffers() {
    triangle.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangle.points, gl.STATIC_DRAW);

    square.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, square.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, square.points, gl.STATIC_DRAW);
}

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100, mView);

    mat4.identity(mMove);
    mat4.translate(mMove, [-1.5, 0, -7]);
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle.buffer);
    gl.vertexAttribPointer(shaderProgram.aPos, triangle.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, triangle.itemsCount);

    mat4.translate(mMove, [3, 0, 0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, square.buffer);
    gl.vertexAttribPointer(shaderProgram.aPos, square.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, square.itemsCount);
}

initGL(document.getElementById('canvas'));
initShaderProgram();
initBuffers();

gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);

function tick() {
    drawScene();

    //requestAnimationFrame(tick);
}

tick();
