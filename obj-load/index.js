const tank = parseObj(TANK_OBJ);

const mView = mat4.create();
const mMove = mat4.create();

const textures = {};

let gl;
let shaderProgram;

const vertexShaderText = `
uniform mat4 umView;
uniform mat4 umMove;

attribute vec3 aPos;
attribute vec3 aN;
attribute vec2 aUV;

//varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
    gl_Position = umView * umMove * vec4(aPos, 1.0);
    vUV = aUV;
    //vNormal = aN;
}
`;

const fragmentShaderText = `
precision mediump float;

uniform sampler2D uSampler;

//varying vec3 vNormal;
varying vec2 vUV;

void main(void) {
    //gl_FragColor = texture2D(uSampler, vec2(vNormal.x, vNormal.y));
    gl_FragColor = texture2D(uSampler, vUV);
}
`;

function initShaderLocations() {
    shaderProgram.umView   = gl.getUniformLocation(shaderProgram, 'umView');
    shaderProgram.umMove   = gl.getUniformLocation(shaderProgram, 'umMove');
    shaderProgram.uSampler = gl.getUniformLocation(shaderProgram, 'uSampler');

    shaderProgram.aPos = gl.getAttribLocation(shaderProgram, 'aPos');
    gl.enableVertexAttribArray(shaderProgram.aPos);

    shaderProgram.aN = gl.getAttribLocation(shaderProgram, 'aN');
    gl.enableVertexAttribArray(shaderProgram.aN);

    shaderProgram.aUV = gl.getAttribLocation(shaderProgram, 'aUV');
    gl.enableVertexAttribArray(shaderProgram.aUV);
}

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.umView, false, mView);
    gl.uniformMatrix4fv(shaderProgram.umMove, false, mMove);
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

        // for (let point of polygon) {
        //     indexArray.push(point.uv);
        // }
        //
        // for (let point of polygon) {
        //     indexArray.push(point.normal);
        // }

        // for (let point of polygon) {
        //     if (
        //         typeof point.vertex !== 'number' ||
        //         typeof point.uv !== 'number' ||
        //         typeof point.normal !== 'number'
        //     ) {
        //         debugger
        //     }
        // }
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

    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufNormals);
    gl.vertexAttribPointer(shaderProgram.aN, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufUVs);
    gl.vertexAttribPointer(shaderProgram.aUV, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(shaderProgram.uSampler, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tank.bufIndex);
    setMatrixUniforms();

    for (let group of tank.groups) {
        if (group.id !== 'Turret_2') {
            //continue;
        }

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[group.material]);

        //console.log(group, tank.bufIndexLength);
        gl.drawElements(gl.TRIANGLES, group.size * 3, gl.UNSIGNED_SHORT, group.offset * 6);
        //gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, group.offset * 2);
    }

    //gl.drawElements(gl.TRIANGLES, tank.bufIndexLength, gl.UNSIGNED_SHORT, 0);
}

initGL(document.getElementById('canvas'));
shaderProgram = initShaderProgram();
initShaderLocations();
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

setTimeout(tick, 1000);
