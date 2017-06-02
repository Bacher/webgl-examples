const tank = parseObj(TANK_OBJ);

const mView = mat4.create();
const mMove = mat4.create();

let gl;
let shaderProgram;

const textures = {};

const vertexShaderText = `
uniform mat4 umView;
uniform mat4 umMove;

attribute vec3 aPos;
attribute vec2 aUVs;

varying vec2 vUV;

void main(void) {
    gl_Position = umView * umMove * vec4(aPos, 1.0);
    vUV = aUVs;
}
`;

const fragmentShaderText = `
precision mediump float;

uniform sampler2D uSampler;

varying vec2 vUV;

void main(void) {
    //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    gl_FragColor = texture2D(uSampler, vUV);
}
`;

function initShader() {
    shaderProgram = initShaderProgram();

    shaderProgram.umView   = gl.getUniformLocation(shaderProgram, 'umView');
    shaderProgram.umMove   = gl.getUniformLocation(shaderProgram, 'umMove');
    shaderProgram.aPos     = gl.getAttribLocation(shaderProgram, 'aPos');
    shaderProgram.aUVs     = gl.getAttribLocation(shaderProgram, 'aUVs');
    shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');

    gl.enableVertexAttribArray(shaderProgram.aPos);
    gl.enableVertexAttribArray(shaderProgram.aUVs);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.umView, false, mView);
    gl.uniformMatrix4fv(shaderProgram.umMove, false, mMove);
}

function initBuffers() {
    tank.bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, tank.vertices, gl.STATIC_DRAW);

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
        textures[group.material] = createTexture(group.material);
    }
}

function createTexture(fileName) {
    const texture = gl.createTexture();

    if (fileName === 'Turret_2') {
        const images = [];
        let loaded = 0;

        for (let i = 0; i < 12; i++) {
            const image = new Image();

            images.push(image);

            image.addEventListener('load', () => {
                loaded++;

                if (loaded === images.length) {
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

                    for (let i = 0; i < 12; i++) {
                        gl.texImage2D(gl.TEXTURE_2D, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[i]);
                    }

                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);

                    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                }
            });

            image.src = `tank/${fileName}${i === 0 ? '' : `_${i}`}.jpg`;
        }
    } else {
        const image = new Image();

        image.addEventListener('load', () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.bindTexture(gl.TEXTURE_2D, null);
        });

        image.src = `tank/${fileName}.jpg`;
    }

    return texture;
}

let rotateAngle = 0;

function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100, mView);
    mat4.translate(mView, [0, -1, -8]);
    mat4.rotateY(mView, rotateAngle);

    mat4.identity(mMove);
    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufVertices);
    gl.vertexAttribPointer(shaderProgram.aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufUVs);
    gl.vertexAttribPointer(shaderProgram.aUVs, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    //gl.bindTexture(gl.TEXTURE_2D, turretTexture);
    gl.uniform1i(shaderProgram.uSampler, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tank.bufIndex);
    setMatrixUniforms();

    for (let group of tank.groups) {
        // if (group.id !== 'Turret_2') {
        //     continue;
        // }

        gl.bindTexture(gl.TEXTURE_2D, textures[group.material]);
        gl.drawElements(gl.TRIANGLES, group.size * 3, gl.UNSIGNED_SHORT, group.offset * 6);
    }

    //gl.drawElements(gl.TRIANGLES, tank.bufIndexLength, gl.UNSIGNED_SHORT, 0);
}

initGL(document.getElementById('canvas'));
initShader();
initBuffers();
initTextures();

gl.clearColor(0, 0, 0, 1);
gl.enable(gl.DEPTH_TEST);

let oldTime = 0;

function tick(newTime) {
    if (oldTime) {
        rotateAngle += 0.001 * (newTime - oldTime);

        drawScene();
    }

    oldTime = newTime;

    requestAnimationFrame(tick);
}

setTimeout(tick, 500);
