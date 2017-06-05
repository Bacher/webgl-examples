const tank = parseObj(TANK_OBJ);

const mCamera = mat4.create();
const mModel  = mat4.create();

const textures = {};

let gl;
let shaderProgram;

const vertexShaderText = `
uniform mat4 umCamera;
uniform mat4 umModel;
uniform mat3 umModel3;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;

attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aUV;

varying vec2 vUV;
varying vec3 vLightWeight;

void main(void) {
    gl_Position = umCamera * umModel * vec4(aPos, 1.0);
    vUV = aUV;

    vec3 transformedNormal = umModel3 * aNormal;
    float directLightWeight = max(dot(transformedNormal, uLightDirection), 0.0);
    vLightWeight = vec3(0.2, 0.2, 0.2) + uLightColor * directLightWeight;
}
`;

const fragmentShaderText = `
precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;
varying vec3 vLightWeight;

void main(void) {
    vec4 textureColor = texture2D(uSampler, vUV);
    gl_FragColor = vec4(textureColor.rgb * vLightWeight, textureColor.a);
}
`;

function initShaderLocations() {
    shaderProgram.umCamera = gl.getUniformLocation(shaderProgram, 'umCamera');
    shaderProgram.umModel  = gl.getUniformLocation(shaderProgram, 'umModel');
    shaderProgram.umModel3 = gl.getUniformLocation(shaderProgram, 'umModel3');
    shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');

    shaderProgram.uLightDirection = gl.getUniformLocation(shaderProgram, 'uLightDirection');
    shaderProgram.uLightColor     = gl.getUniformLocation(shaderProgram, 'uLightColor');

    shaderProgram.aPos    = gl.getAttribLocation(shaderProgram, 'aPos');
    shaderProgram.aNormal = gl.getAttribLocation(shaderProgram, 'aNormal');
    shaderProgram.aUV     = gl.getAttribLocation(shaderProgram, 'aUV');

    gl.enableVertexAttribArray(shaderProgram.aPos);
    gl.enableVertexAttribArray(shaderProgram.aNormal);
    gl.enableVertexAttribArray(shaderProgram.aUV);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.umCamera, false, mCamera);
    gl.uniformMatrix4fv(shaderProgram.umModel, false, mModel);
    gl.uniformMatrix3fv(shaderProgram.umModel3, false, mat4.toMat3(mModel));
}

function initBuffers() {
    tank.bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, tank.vertices, gl.STATIC_DRAW);

    tank.bufNormals = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufNormals);
    gl.bufferData(gl.ARRAY_BUFFER, tank.normals, gl.STATIC_DRAW);

    tank.bufUVs = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufUVs);
    gl.bufferData(gl.ARRAY_BUFFER, tank.uvs, gl.STATIC_DRAW);

    const indexArray = [];

    for (let polygon of tank.polygons) {
        for (let point of polygon) {
            indexArray.push(point.vertex);
        }
    }

    const uIndexArray = new Uint16Array(indexArray);

    tank.bufIndex = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tank.bufIndex);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, uIndexArray, gl.STATIC_DRAW);
    tank.bufIndexLength = uIndexArray.length;
}

function initTextures() {
    for (let group of tank.groups) {
        textures[group.material] = createTexture(`tank/${group.material}.jpg`);
    }
}

let rotateAngle = 0;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100, mCamera);
    mat4.translate(mCamera, [0, -1, -8]);

    mat4.identity(mModel);
    mat4.rotateY(mModel, rotateAngle);
    mat4.translate(mModel, [2, 0, 0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufVertices);
    gl.vertexAttribPointer(shaderProgram.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufNormals);
    gl.vertexAttribPointer(shaderProgram.aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufUVs);
    gl.vertexAttribPointer(shaderProgram.aUV, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(shaderProgram.uSampler, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tank.bufIndex);
    setMatrixUniforms();

    for (let group of tank.groups) {
        gl.bindTexture(gl.TEXTURE_2D, textures[group.material]);

        gl.drawElements(gl.TRIANGLES, group.size * 3, gl.UNSIGNED_SHORT, group.offset * 6);
    }

    //gl.drawElements(gl.TRIANGLES, tank.bufIndexLength, gl.UNSIGNED_SHORT, 0);
}

function initLight() {
    const lightingDirection = [-1.25, -0.25, -2];
    const adjustedLD = vec3.create();

    vec3.normalize(lightingDirection, adjustedLD);
    vec3.scale(adjustedLD, -1);
    gl.uniform3fv(shaderProgram.uLightDirection, adjustedLD);

    gl.uniform3f(shaderProgram.uLightColor, 0.8, 0.8, 0.8);
}

initGL(document.getElementById('canvas'));
shaderProgram = initShaderProgram();
initShaderLocations();
initBuffers();
initTextures();
initLight();

gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);

let oldTime = 0;

function tick(newTime) {
    if (oldTime) {
        rotateAngle -= 0.001 * (newTime - oldTime);

        drawScene();
    }

    oldTime = newTime;

    requestAnimationFrame(tick);
}

setTimeout(tick, 1000);
