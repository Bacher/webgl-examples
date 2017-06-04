
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

function createTexture(fileName) {
    const texture = gl.createTexture();

    const image = new Image();

    image.addEventListener('load', () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindTexture(gl.TEXTURE_2D, null);
    });

    image.src = `tank/${fileName}.jpg`;

    return texture;
}
