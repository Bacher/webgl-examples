
function parseObj(objText) {
    const lines = objText.split(/\s*\n\s*/);

    const vertices = [];
    const uvs      = [];
    const normals  = [];
    const polygons = [];

    const groups = [];
    let currentGroup = null;

    for (let rawLine of lines) {
        const line = rawLine.replace(/#.*$/, '').trim();

        if (!line) {
            continue;
        }

        const [, command, rest] = line.match(/^(\w+) (.*)$/);

        if (command === 'g') {
            currentGroup = createEmptyGroup(rest);
            groups.push(currentGroup);
            currentGroup.offset = polygons.length;
            continue;
        }

        if (!currentGroup && ['usemtl', 'v', 'vt', 'f'].includes(command)) {
            currentGroup = createEmptyGroup();
            groups.push(currentGroup);
        }

        switch (command) {
            case 'usemtl':
                currentGroup.material = rest;
                break;
            case 'v':
                vertices.push(...rest.split(' ').map(Number));
                break;
            case 'vt':
                const uv = rest.split(' ').map(Number);
                uvs.push(uv[0], uv[1]);
                break;
            case 'f':
                currentGroup.size++;
                polygons.push(rest.split(' ').map(point => {
                    const parts = point.split('/');

                    return {
                        vertex: Number(parts[0]) - 1,
                        uv:     parts[1] != null ? Number(parts[1]) - 1 : null,
                        normal: parts[2] != null ? Number(parts[2]) - 1 : null,
                    };
                }));
                break;
        }
    }

    // for (let groupName in groups) {
    //     groups[groupName].vertices = new Float32Array(groups[groupName].vertices);
    //     groups[groupName].uvs      = new Float32Array(groups[groupName].uvs);
    //     groups[groupName].normals  = new Float32Array(groups[groupName].normals);
    // }

    return {
        vertices: new Float32Array(vertices),
        uvs:      new Float32Array(uvs),
        normals:  new Float32Array(normals),
        polygons: polygons,
        groups,
    };
}

function createEmptyGroup(id) {
    return {
        id:       id || 'default',
        material: null,
        offset:   0,
        size:     0,
    };
}
