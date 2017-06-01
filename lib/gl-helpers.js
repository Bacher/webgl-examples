
window.gl = null;

function initGL(canvas) {
    gl                = canvas.getContext('webgl');
    gl.viewportWidth  = canvas.width;
    gl.viewportHeight = canvas.height;
}

function makeShader(type, shaderCode) {
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
    const vertexShader   = makeShader(gl.VERTEX_SHADER, vertexShaderText);
    const fragmentShader = makeShader(gl.FRAGMENT_SHADER, fragmentShaderText);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Could not initialize shader program');
        throw new Error('Shader program failed');
    }

    gl.useProgram(shaderProgram);

    return shaderProgram;
}
