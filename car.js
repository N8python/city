import * as THREE from './three/build/three.module.js';
import * as BufferGeometryUtils from './three/examples/jsm/utils/BufferGeometryUtils.js';

function angleDifference(angle1, angle2) {
    const diff = ((angle2 - angle1 + Math.PI) % (Math.PI * 2)) - Math.PI;
    return (diff < -Math.PI) ? diff + (Math.PI * 2) : diff;
}
let carBodyColors = [
    [0.8, 0.8, 0.8],
    [0.8, 0.8, 0.8],
    [0.8, 0.8, 0.8],
    [0.8, 0.8, 0.8],
    [0.8, 0.8, 0.8],
    [0.8, 0.8, 0.8],
    [0.8, 0.8, 0.8],
    [0.8, 0.4, 0.4],
    [0.5, 0.7, 0.8],
    [0.8, 0.8, 0.4],
    [0.6, 0.6, 0.6],
    [0.6, 0.6, 0.6],
    [0.6, 0.6, 0.6],
    [0.6, 0.6, 0.6],
    [0.4, 0.4, 0.4],
    [0.4, 0.4, 0.4]
]
class Car {
    constructor({
        env,
        rrough,
        rnormal,
        ralpha,
        rmetal,
        tire,
        tireNormal,
        tireMetal,
        aoMat,
        size,
        aoSource,
        aoIdx
    }) {
        this.reflectiveMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.5, 0.5, 0.5), transparent: true, opacity: 1.0, metalness: 1, side: THREE.DoubleSide, envMap: env, roughnessMap: rrough, roughness: 0.0, normalMap: rnormal, alphaMap: ralpha, metalnessMap: rmetal, map: rmetal });
        this.tireMaterial = new THREE.MeshStandardMaterial({ map: tire, normalMap: tireNormal, metalness: 1.0, envMap: env, roughness: 0.5, metalnessMap: tireMetal });
        this.bodyMaterial = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(...carBodyColors[Math.floor(Math.random() * carBodyColors.length)]), normalMap: rnormal, metalness: 0.6, roughness: 0.4, clearcoat: 0.05, clearcoatRoughness: 0.05, envMap: env, side: THREE.DoubleSide });
        this.mesh = new THREE.Object3D();
        /* this.mainBody = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 0.33), this.bodyMaterial);
         this.mainBody.position.y = -0.3;
         this.mesh.add(this.mainBody);*/
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.aoSource = aoSource;
        this.aoIdx = aoIdx;
        /*this.wheel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.025, 32), this.tireMaterial);
        this.wheel1.rotation.x = Math.PI / 2;
        this.wheel1.position.z = 0.33 / 2;
        this.wheel1.position.y = -0.3 - 0.125 / 2 - 0.0125;
        this.wheel1.position.x = -0.3;
        this.mesh.add(this.wheel1);
        this.wheel2 = this.wheel1.clone();
        this.wheel2.position.x *= -1;
        this.mesh.add(this.wheel2);
        this.wheel3 = this.wheel1.clone();
        this.wheel3.position.z *= -1;
        this.mesh.add(this.wheel3);
        this.wheel4 = this.wheel2.clone();
        this.wheel4.position.z *= -1;
        this.mesh.add(this.wheel4);*/
        this.wheels = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.125, 0.125, 0.025, 32), this.tireMaterial, 4);
        const wheel1Mat = new THREE.Matrix4();
        wheel1Mat.makeRotationX(Math.PI / 2);
        wheel1Mat.setPosition(-0.3, -0.3 - 0.125 / 2 - 0.0125, 0.33 / 2);
        this.wheels.setMatrixAt(0, wheel1Mat);
        const wheel2Mat = new THREE.Matrix4();
        wheel2Mat.makeRotationX(Math.PI / 2);
        wheel2Mat.setPosition(0.3, -0.3 - 0.125 / 2 - 0.0125, 0.33 / 2);
        this.wheels.setMatrixAt(1, wheel2Mat);
        const wheel3Mat = new THREE.Matrix4();
        wheel3Mat.makeRotationX(Math.PI / 2);
        wheel3Mat.setPosition(-0.3, -0.3 - 0.125 / 2 - 0.0125, -0.33 / 2);
        this.wheels.setMatrixAt(2, wheel3Mat);
        const wheel4Mat = new THREE.Matrix4();
        wheel4Mat.makeRotationX(Math.PI / 2);
        wheel4Mat.setPosition(0.3, -0.3 - 0.125 / 2 - 0.0125, -0.33 / 2);
        this.wheels.setMatrixAt(3, wheel4Mat);
        this.mesh.add(this.wheels);
        //this.topMesh = new THREE.Object3D();
        /*this.windshieldGeo = new THREE.Mesh(Car.curveGeo, this.bodyMaterial);
        this.windshieldGeo.position.x = -0.425;
        this.windshieldGeo.position.y = -0.4 / 2;
        this.windshieldGeo.position.z = -0.33 / 2;
        this.windshieldGeo.scale.y = 0.5;
        this.windshieldGeo.scale.x = 0.55;
        this.topMesh.add(this.windshieldGeo);*/
        /* this.carTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2545, 0.33), this.bodyMaterial);
         this.carTop.position.x = 0;
         this.carTop.position.y = -0.0775;
         this.topMesh.add(this.carTop);*/
        /*this.rearGeo = new THREE.Mesh(Car.curveGeo, this.bodyMaterial);
        this.rearGeo.position.x = 0.375;
        this.rearGeo.position.y = -0.4 / 2;
        this.rearGeo.position.z = -0.33 / 2;
        this.rearGeo.scale.y = 0.5;
        this.rearGeo.scale.x = -0.45;
        this.topMesh.add(this.rearGeo);*/
        //this.mesh.add(this.topMesh);
        const mainBody = new THREE.BoxGeometry(1, 0.2, 0.33);
        const carTop = new THREE.BoxGeometry(0.3, 0.2545, 0.33);
        const rearGeo = Car.curveGeo2.clone();
        const windshieldGeo = Car.curveGeo.clone();
        const mainBodyMatrix = new THREE.Matrix4();
        mainBodyMatrix.setPosition(0, -0.3, 0);
        mainBody.applyMatrix4(mainBodyMatrix);
        const carTopMatrix = new THREE.Matrix4();
        carTopMatrix.setPosition(0, -0.0775, 0);
        carTop.applyMatrix4(carTopMatrix);
        const rearGeoMatrix = new THREE.Matrix4();
        rearGeoMatrix.setPosition(0.375, -0.4 / 2, -0.33 / 2);
        rearGeoMatrix.multiply(new THREE.Matrix4().makeScale(0.45, 0.5, 1.0));
        rearGeo.applyMatrix4(rearGeoMatrix);
        const windshieldGeoMatrix = new THREE.Matrix4();
        windshieldGeoMatrix.setPosition(-0.425, -0.4 / 2, -0.33 / 2);
        windshieldGeoMatrix.multiply(new THREE.Matrix4().makeScale(0.55, 0.5, 1.0));
        windshieldGeo.applyMatrix4(windshieldGeoMatrix);
        const bodyGeo = BufferGeometryUtils.mergeBufferGeometries([mainBody.toNonIndexed(), carTop.toNonIndexed(), rearGeo, windshieldGeo]);
        this.bodyMesh = new THREE.Mesh(bodyGeo, this.bodyMaterial);
        this.mesh.add(this.bodyMesh);
        /*this.windshield = new THREE.Mesh(new THREE.PlaneGeometry(0.125, 0.25), this.reflectiveMaterial);
        this.windshield.rotation.x = Math.PI / 2;
        this.windshield.rotation.y = -Math.PI / 3.15;
        this.windshield.position.x = 0.325;
        this.windshield.position.y = -0.05;
        this.mesh.add(this.windshield);
        this.trunkWindow = this.windshield.clone();
        this.trunkWindow.rotation.y *= -1;
        this.trunkWindow.position.x = -0.365;
        this.mesh.add(this.trunkWindow);
        this.sunRoof = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.25), this.reflectiveMaterial);
        this.sunRoof.rotation.x = Math.PI / 2;
        this.sunRoof.position.y = 0.0525;
        this.mesh.add(this.sunRoof);
        this.window1 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), this.reflectiveMaterial);
        this.window1.position.z = 0.17;
        this.window1.position.y = -0.1;
        this.mesh.add(this.window1);
        this.window2 = this.window1.clone();
        this.window2.position.z *= -1;
        this.mesh.add(this.window2);*/
        this.windows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), this.reflectiveMaterial, 5);
        const windshieldMatrix = new THREE.Matrix4();
        windshieldMatrix.setPosition(0.325, -0.05, 0);
        windshieldMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        windshieldMatrix.multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 3.15));
        windshieldMatrix.multiply(new THREE.Matrix4().makeScale(0.125, 0.25, 0.0));
        this.windows.setMatrixAt(0, windshieldMatrix);
        const trunkWindowMatrix = new THREE.Matrix4();
        trunkWindowMatrix.setPosition(-0.365, -0.05, 0);
        trunkWindowMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        trunkWindowMatrix.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 3.15));
        trunkWindowMatrix.multiply(new THREE.Matrix4().makeScale(0.125, 0.25, 0.0));
        this.windows.setMatrixAt(1, trunkWindowMatrix);
        const sunRoofMatrix = new THREE.Matrix4();
        sunRoofMatrix.setPosition(0, 0.0525, 0);
        sunRoofMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        //sunRoofMatrix.multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 3.15));
        sunRoofMatrix.multiply(new THREE.Matrix4().makeScale(0.35, 0.25, 0.0));
        this.windows.setMatrixAt(2, sunRoofMatrix);
        const window1Matrix = new THREE.Matrix4();
        window1Matrix.setPosition(0, -0.1, 0.17);
        window1Matrix.multiply(new THREE.Matrix4().makeScale(0.5, 0.2, 0.0));
        this.windows.setMatrixAt(3, window1Matrix);
        const window2Matrix = new THREE.Matrix4();
        window2Matrix.setPosition(0, -0.1, -0.17);
        window2Matrix.multiply(new THREE.Matrix4().makeScale(0.5, 0.2, 0.0));
        this.windows.setMatrixAt(4, window2Matrix);
        this.mesh.add(this.windows);
        const AOMat = new THREE.MeshStandardMaterial({
            color: 0,
            alphaMap: aoMat,
            transparent: true,
            side: THREE.DoubleSide,
            opacity: 0.4
        });
        const AOGeo = new THREE.PlaneGeometry(1, 1);
        const AOMesh = new THREE.Mesh(AOGeo, AOMat);
        AOMesh.rotation.x = Math.PI / 2;
        AOMesh.scale.x = 0.9;
        AOMesh.scale.y = 0.45;
        //AOMesh.scale.y = building.width * 12.5;
        AOMesh.position.y = -0.49;
        //this.mesh.add(AOMesh);
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        const AOMatrix = new THREE.Matrix4();
        //AOMatrix.setPosition(this.mesh.position.x, 0.01, this.mesh.position.z);
        //AOMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        //AOMatrix.multiply(new THREE.Matrix4().makeRotationY(this.direction));
        //AOMatrix.multiply(new THREE.Matrix4().makeScale(10 * 0.9 * this.length, 10 * 0.45 * this.width, 10 * 1.0));
        AOMatrix.multiply(this.mesh.matrix);
        AOMatrix.multiply(new THREE.Matrix4().makeTranslation(0, -0.49, 0));
        AOMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        AOMatrix.multiply(new THREE.Matrix4().makeScale(0.9, 0.45, 1.0));
        this.aoSource.setMatrixAt(this.aoIdx, AOMatrix);
        this.length = 0.75 + Math.random() * 0.5;
        this.width = 0.75 + Math.random() * 0.5;
        this.height = 0.875 + Math.random() * 0.25;
        this.size = size;
        this.speed = 0.75 + Math.random() * 0.75;
        this.direction = 0;
        this.lastUpdate = performance.now();
    }
    update(directionMap, cityMap) {
        const timeScale = Math.min((performance.now() - this.lastUpdate) / 16.666, 3);
        this.lastUpdate = performance.now();
        /*this.wheel1.rotation.y -= 0.1;
        this.wheel2.rotation.y -= 0.1;
        this.wheel3.rotation.y -= 0.1;
        this.wheel4.rotation.y -= 0.1;*/
        const AOMatrix = new THREE.Matrix4();
        //AOMatrix.setPosition(this.mesh.position.x, 0.01, this.mesh.position.z);
        //AOMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        //AOMatrix.multiply(new THREE.Matrix4().makeRotationY(this.direction));
        //AOMatrix.multiply(new THREE.Matrix4().makeScale(10 * 0.9 * this.length, 10 * 0.45 * this.width, 10 * 1.0));
        AOMatrix.multiply(this.mesh.matrix);
        AOMatrix.multiply(new THREE.Matrix4().makeTranslation(0, -0.49, 0));
        AOMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        AOMatrix.multiply(new THREE.Matrix4().makeScale(0.9, 0.45, 1.0));
        this.aoSource.setMatrixAt(this.aoIdx, AOMatrix);
        const rotMat = new THREE.Matrix4();
        rotMat.makeRotationY(-0.1 * timeScale);
        for (let i = 0; i < 4; i++) {
            const wheelMat = new THREE.Matrix4();
            this.wheels.getMatrixAt(i, wheelMat);
            wheelMat.multiplyMatrices(wheelMat, rotMat);
            this.wheels.setMatrixAt(i, wheelMat);
        }
        this.wheels.instanceMatrix.needsUpdate = true;
        this.mesh.scale.set(this.size * this.length, this.size * this.height, this.size * this.width);
        this.mesh.position.y = this.size * this.height / 2;
        this.mesh.rotation.y += angleDifference(this.mesh.rotation.y, this.direction) / 10 * timeScale;
        const x = Math.floor((this.mesh.position.x - 5) / 10);
        const z = Math.floor((this.mesh.position.z - 5) / 10);
        if (this.path && this.path.reached && this.path.path && this.path.path.length > 0) {
            if (this.path.reached) {
                this.direction = Math.atan2((this.path.path[0][0] * 10 + 5) - this.mesh.position.x, (this.path.path[0][1] * 10 + 5) - this.mesh.position.z) - Math.PI / 2;
                this.mesh.position.x += 0.1 * Math.sin(this.direction + Math.PI / 2) * timeScale * this.speed;
                this.mesh.position.z += 0.1 * Math.cos(this.direction + Math.PI / 2) * timeScale * this.speed;
                if (Math.hypot((this.path.path[0][0] * 10 + 5) - this.mesh.position.x, (this.path.path[0][1] * 10 + 5) - this.mesh.position.z) < 0.2) {
                    //if (Math.random() < 0.1) {
                    this.mesh.position.x = this.path.path[0][0] * 10 + 5;
                    this.mesh.position.z = this.path.path[0][1] * 10 + 5;
                    this.path.path.shift();
                    if (this.path.path.length === 0) {
                        this.path = undefined;
                    } else {
                        this.direction = Math.atan2((this.path.path[0][0] * 10 + 5) - this.mesh.position.x, (this.path.path[0][1] * 10 + 5) - this.mesh.position.z) - Math.PI / 2;
                    }
                }
            }
        }
        if (this.path === undefined) {
            //console.log("YAY")
            let x2;
            let z2;
            while (true) {
                x2 = Math.floor((-50 + Math.random() * 100));
                z2 = Math.floor((-50 + Math.random() * 100));
                if (directionMap[(x2 + 50) * 100 + (z2 + 50)] > 0) {
                    break;
                }
            }
            //console.time();
            const p = Car.findPath({ x, z }, { x: x2, z: z2 }, directionMap, cityMap);
            this.path = p;
            if (this.path.path) {
                this.path.path.shift();
            }
            //console.log(this.path);
            this.newPathTick = 0;
            //console.timeEnd();
        }
        if (this.path && !this.path.reached) {
            this.newPathTick++;
            if (this.newPathTick > 20) {
                //console.log("relocating")
                let x;
                let z;
                while (true) {
                    x = Math.floor((-50 + Math.random() * 100));
                    z = Math.floor((-50 + Math.random() * 100));
                    if (directionMap[(x + 50) * 100 + (z + 50)] > 0) {
                        this.mesh.position.set(x * 10 + 5, 5, z * 10 + 5);
                        break;
                    }
                }
                this.path = undefined;
                //}
                //}
            }
        }
    }
}
Car.curveShape = new THREE.Shape();
Car.curveShape.moveTo(0, 0).quadraticCurveTo(0.1, 0.5, 0.5, 0.5).lineTo(0.5, 0).lineTo(0, 0);
Car.curveExtrude = {
    steps: 2,
    depth: 0.33,
    bevelEnabled: false,
    bevelThickness: 1,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 1
};
Car.curveGeo = new THREE.ExtrudeGeometry(Car.curveShape, Car.curveExtrude);
Car.curveShape2 = new THREE.Shape();
Car.curveShape2.moveTo(0, 0).quadraticCurveTo(-0.1, 0.5, -0.5, 0.5).lineTo(-0.5, 0).lineTo(0, 0);
Car.curveGeo2 = new THREE.ExtrudeGeometry(Car.curveShape2, Car.curveExtrude);
Car.prototypeMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
const getNeighbors = (e) => {
    e = e.split(",");
    const x = +e[0];
    const z = +e[1];
    return [
        `${x + 1},${z}`,
        `${x - 1},${z}`,
        `${x},${z + 1}`,
        `${x},${z - 1}`
    ]
}
Car.findPath = (start, end, directionMap, cityMap, maxTime = 20) => {
    const startTime = performance.now();
    const toExplore = [start.x + "," + start.z];
    const explored = [];
    const goal = end.x + "," + end.z;
    if (directionMap[(end.x + 50) * 100 + (end.z + 50)] === 0) {
        return {
            reached: false
        }
    }
    const cameFrom = {};
    let goalReached = false;
    while (toExplore.length > 0) {
        if ((performance.now() - startTime) > maxTime) {
            return {
                reached: false
            }
        }
        toExplore.sort((a, b) => {
            a = a.split(",");
            b = b.split(",");
            return Math.hypot(a[0] - end.x, a[1] - end.z) - Math.hypot(b[0] - end.x, b[1] - end.z);
        })
        const e = toExplore.shift();
        if (e === goal) {
            goalReached = true;
            break;
        }
        explored.push(e);
        const neighbors = getNeighbors(e);
        neighbors.forEach(neighbor => {
            const neighborArr = neighbor.split(",");
            if (directionMap[(+neighborArr[0] + 50) * 100 + (+neighborArr[1] + 50)] > 0 && !explored.includes(neighbor) && !toExplore.includes(neighbor) && !Object.keys(cameFrom).includes(neighbor)) {
                toExplore.push(neighbor);
                cameFrom[neighbor] = e;
            }
        })
    }
    if (!goalReached) {
        return {
            reached: false
        }
    }
    let path = [goal];
    while (true) {
        const source = cameFrom[path[path.length - 1]];
        if (source) {
            path.push(source);
        } else {
            break;
        }
    }
    return {
        reached: true,
        path: path.reverse().map(x => x.split(",").map(n => +n))
    };
}
export {
    Car
};