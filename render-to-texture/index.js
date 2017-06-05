const vertexShaderText = `
uniform mat4 umCamera;
uniform mat4 umModel;

attribute vec3 aPos;
attribute vec2 aUV;

varying vec2 vUV;

void main(void) {
    vUV = aUV;
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
}
`;

const fragmentShaderText = `
precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;

void main(void) {
    gl_FragColor = texture2D(uSampler, vUV);
}
`;

const solidVertexShaderText = `
uniform mat4 umCamera;
uniform mat4 umModel;

attribute vec3 aPos;

void main(void) {
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
}
`;

const solidFragmentShaderText = `
precision mediump float;

void main(void) {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
`;

let gl;
let crateTexture;
let tmpFrameBuffer;
let tmpTexture;

const mCamera = mat4.create();
const mModel  = mat4.create();

let cubeVertexPositionBuffer;
let cubeVertexTextureCoordBuffer;
let cubeVertexIndexBuffer;

let laptopScreenVertexPositionBuffer;
let laptopScreenVertexTextureCoordBuffer;

let innerShader;
let outerShader;

function initShader(vertexShaderText, fragmentShaderText, isHaveUV) {
    const shader = {};

    shader.program = initShaderProgram2(vertexShaderText, fragmentShaderText);

    shader.umCamera = gl.getUniformLocation(shader.program, 'umCamera');
    shader.umModel  = gl.getUniformLocation(shader.program, 'umModel');

    shader.aPos = gl.getAttribLocation(shader.program, 'aPos');
    //gl.enableVertexAttribArray(shader.aPos);

    if (isHaveUV) {
        shader.uSampler = gl.getUniformLocation(shader.program, 'uSampler');

        shader.aUV = gl.getAttribLocation(shader.program, 'aUV');
        //gl.enableVertexAttribArray(shader.aUV);
    }

    gl.useProgram(null);

    return shader;
}

function initBuffers() {
    cubeVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    const vertices = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    cubeVertexPositionBuffer.itemSize = 3;
    cubeVertexPositionBuffer.numItems = 24;

    cubeVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    const textureCoords = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
    cubeVertexTextureCoordBuffer.itemSize = 2;
    cubeVertexTextureCoordBuffer.numItems = 24;

    cubeVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    const cubeVertexIndices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
    cubeVertexIndexBuffer.itemSize = 1;
    cubeVertexIndexBuffer.numItems = 36;

    //

    // Screen

    laptopScreenVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexPositionBuffer);
    const screenVertices = [
        1, 1, 0,
        -1, 1, 0,
        1, -0.3, 0,
        -1, -0.3, 0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenVertices), gl.STATIC_DRAW);
    laptopScreenVertexPositionBuffer.itemSize = 3;
    laptopScreenVertexPositionBuffer.numItems = 4;

    laptopScreenVertexTextureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexTextureCoordBuffer);
    const screenTextureCoords = [
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(screenTextureCoords), gl.STATIC_DRAW);
    laptopScreenVertexTextureCoordBuffer.itemSize = 2;
    laptopScreenVertexTextureCoordBuffer.numItems = 4;
}

function initTextures() {
    //crateTexture = createTexture('crate.gif');

    tmpFrameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, tmpFrameBuffer);

    tmpTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tmpTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.generateMipmap(gl.TEXTURE_2D);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const depthBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tmpTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function setMatrixUniforms(shader) {
    gl.uniformMatrix4fv(shader.umCamera, false, mCamera);
    gl.uniformMatrix4fv(shader.umModel, false, mModel);
}

let yRotate = 0;

let i = 0;

function drawScene() {
    i++;

    gl.useProgram(innerShader.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tmpFrameBuffer);

    gl.viewport(0, 0, 512, 512);
    gl.clearColor(0.3, 0.3, 0.3, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, 1.25, 0.1, 100.0, mCamera);

    mat4.identity(mModel);

    mat4.translate(mModel, [0.0, 0.0, -4.0]);

    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
    gl.enableVertexAttribArray(innerShader.aPos);
    gl.vertexAttribPointer(innerShader.aPos, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
    // gl.vertexAttribPointer(innerShader.aUV, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    //gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, crateTexture);
    //gl.uniform1i(shader.uSampler, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
    setMatrixUniforms(innerShader);
    gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

    //gl.bindTexture(gl.TEXTURE_2D, tmpTexture);
    //gl.generateMipmap(gl.TEXTURE_2D);
    //gl.bindTexture(gl.TEXTURE_2D, null);

    ///
    //return;

    gl.useProgram(outerShader.program);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, mCamera);
    mat4.translate(mCamera, [0, 0, -8]);

    mat4.identity(mModel);
    mat4.rotateY(mModel, yRotate);

    gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexPositionBuffer);
    gl.enableVertexAttribArray(outerShader.aPos);
    gl.vertexAttribPointer(outerShader.aPos, laptopScreenVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, laptopScreenVertexTextureCoordBuffer);
    gl.enableVertexAttribArray(outerShader.aUV);
    gl.vertexAttribPointer(outerShader.aUV, laptopScreenVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tmpTexture);
    gl.uniform1i(outerShader.uSampler, 0);

    setMatrixUniforms(outerShader);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, laptopScreenVertexPositionBuffer.numItems);
}

initGL(document.getElementById('canvas'));
innerShader = initShader(solidVertexShaderText, solidFragmentShaderText);
outerShader = initShader(vertexShaderText, fragmentShaderText, true);
initBuffers();
initTextures();

//gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);

setTimeout(() => {
    setInterval(() => {
        yRotate += 0.1;
        drawScene()
    }, 100);
}, 2000);

