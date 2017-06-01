const tank = parseObj(TANK_OBJ);
const turret2 = tank.groups['Turret_2'];

const mView = mat4.create();
const mMove = mat4.create();

let gl;
let shaderProgram;

const vertexShaderText = `
uniform mat4 umView;
uniform mat4 umMove;

attribute vec3 aPos;
//attribute vec4 aColor;

//varying vec4 vColor;

void main(void) {
    gl_Position = umView * umMove * vec4(aPos, 1.0);
    //vColor = aColor;
}
`;

const fragmentShaderText = `
precision mediump float;

//varying vec4 vColor;

void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
}
`;

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.umView, false, mView);
    gl.uniformMatrix4fv(shaderProgram.umMove, false, mMove);
}

function initBuffers() {
    tank.bufVertices = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tank.bufVertices);
    gl.bufferData(gl.ARRAY_BUFFER, tank.vertices, gl.STATIC_DRAW);

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

    // turret2.bufColors = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, triangle.bufColors);
    // gl.bufferData(gl.ARRAY_BUFFER, triangle.colors, gl.STATIC_DRAW);
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
    // gl.bindBuffer(gl.ARRAY_BUFFER, triangle.bufColors);
    // gl.vertexAttribPointer(shaderProgram.aColor, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tank.bufIndex);
    setMatrixUniforms();

    for (let groupName in tank.groups) {
        const group = tank.groups[groupName];

        if (groupName !== 'Turret_2') {
            //continue;
        }

        //console.log(group, tank.bufIndexLength);
        gl.drawElements(gl.TRIANGLES, group.size * 3, gl.UNSIGNED_SHORT, group.offset * 6);
        //gl.drawElements(gl.TRIANGLES, size, gl.UNSIGNED_SHORT, group.offset * 2);
    }

    //gl.drawElements(gl.TRIANGLES, tank.bufIndexLength, gl.UNSIGNED_SHORT, 0);
}

initGL(document.getElementById('canvas'));
shaderProgram = initShaderProgram();

shaderProgram.umView = gl.getUniformLocation(shaderProgram, 'umView');
shaderProgram.umMove = gl.getUniformLocation(shaderProgram, 'umMove');
shaderProgram.aPos   = gl.getAttribLocation(shaderProgram, 'aPos');
//shaderProgram.aColor = gl.getAttribLocation(shaderProgram, 'aColor');

gl.enableVertexAttribArray(shaderProgram.aPos);
//gl.enableVertexAttribArray(shaderProgram.aColor);

initBuffers();

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

tick();
