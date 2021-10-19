import * as THREE from './three/build/three.module.js';
import * as SkeletonUtils from "./three/examples/jsm/utils/SkeletonUtils.js";

function angleDifference(angle1, angle2) {
    const diff = ((angle2 - angle1 + Math.PI) % (Math.PI * 2)) - Math.PI;
    return (diff < -Math.PI) ? diff + (Math.PI * 2) : diff;
}
class Robot {
    constructor(model, {
        size = 1,
        position,
        direction,
        anims,
        occludingBoxes,
        camera,
        raycaster,
        lodInstances,
        instanceIdx,
        ambientIdx,
        ambientInstances,
        startState = "default"
    }, scene) {
        this.mesh = SkeletonUtils.clone(model.scene);
        this.mesh.scale.set(size, size, size);
        this.mesh.position.copy(position);
        this.mesh.rotation.y = direction;
        this.direction = direction;
        this.state = {
            type: "idle",
            memory: {}
        }
        this.currentAnim = "none";
        this.oobMatrix = new THREE.Matrix4();
        this.oobMatrix.setPosition(10000000 + 10000000 * Math.random(), 0, 0);
        this.box3 = new THREE.Box3();
        this.box3.setFromCenterAndSize(new THREE.Vector3(0, 5 * size, 0).add(this.mesh.position), new THREE.Vector3(5 * size, 10 * size, 5 * size));
        this.size = size;
        // const helper = new THREE.Box3Helper(this.box3, 0xffffff);
        // scene.add(helper);
        this.mixer = new THREE.AnimationMixer(this.mesh);
        this.anims = {};
        this.anims.default = this.mixer.clipAction(model.animations[0]);
        Object.entries(anims).forEach(([name, anim]) => {
                this.anims[name] = this.mixer.clipAction(anim);
            })
            //this.anims[startState].play();
        this.anims.idle.play();
        this.anims.walk.play();
        this.occludingBoxes = occludingBoxes;
        this.lodInstances = lodInstances;
        this.instanceIdx = instanceIdx;
        this.camera = camera;
        this.raycaster = raycaster;
        this.scene = scene;
        this.added = false;
        this.ambientIdx = ambientIdx;
        this.ambientInstances = ambientInstances;
        this.mesh.traverse(child => {
            if (child.name === "mixamorigLeftToeBase") {
                this.foot1 = child;
            }
            if (child.name === "mixamorigRightToeBase") {
                this.foot2 = child;
            }
        });
        this.randomYOffset = Math.random() * 0.01;
        this.foot1Matrix = new THREE.Matrix4();
        this.foot2Matrix = new THREE.Matrix4();
        this.foot1Pos = new THREE.Vector3();
        this.foot2Pos = new THREE.Vector3();
        this.clearMatrix = new THREE.Matrix4();
        this.transformMatrix = new THREE.Matrix4();
    }
    update(delta, frustum, occludingBoxes) {
        const timeScale = Math.min((performance.now() - this.lastUpdate) / 16.666, 3);
        this.lastUpdate = performance.now();
        if (this.state.type === "idle" && this.currentAnim !== "idle") {
            this.anims.idle.enabled = true;
            this.anims.idle.fadeIn(0.25);
            this.anims.walk.fadeOut(0.25);
            this.currentAnim = "idle";
        }
        if (this.state.type === "walk" && this.currentAnim !== "walk") {
            this.anims.walk.enabled = true;
            this.anims.idle.fadeOut(0.25);
            this.anims.walk.fadeIn(0.25);
            this.currentAnim = "walk";
        }
        if (this.state.type === "idle") {
            if (Math.random() < 0.001) {
                let x;
                let z;
                const originVector = new THREE.Vector3(this.mesh.position.x, 1, this.mesh.position.z);
                const point = new THREE.Vector3()
                while (true) {
                    const offsetX = 50 - 100 * Math.random();
                    const offsetZ = 50 - 100 * Math.random();
                    const offsetDist = Math.hypot(offsetX, offsetZ);
                    x = this.mesh.position.x + offsetX;
                    z = this.mesh.position.z + offsetZ;
                    if (Math.hypot(x, z) <= 500) {
                        const ptVector = new THREE.Vector3(x, 1, z);
                        const ray = new THREE.Ray(originVector, ptVector.sub(originVector).normalize());
                        let contained = false;
                        for (let i = 0; i < occludingBoxes.length; i++) {
                            const intersect = ray.intersectBox(occludingBoxes[i], point);
                            if (intersect && point.distanceTo(originVector) < offsetDist) {
                                contained = true;
                                break;
                            }
                        }
                        if (!contained) {
                            break;
                        }
                    }
                }
                this.state = {
                    type: "walk",
                    memory: {
                        target: { x, z }
                    }
                };
            }
        } else if (this.state.type == "walk") {
            this.direction = Math.atan2(this.state.memory.target.x - this.mesh.position.x, this.state.memory.target.z - this.mesh.position.z);
            this.mesh.rotation.y += angleDifference(this.mesh.rotation.y, this.direction) / 10 * timeScale;
            this.mesh.position.x += 0.1 * Math.sin(this.direction) * timeScale;
            this.mesh.position.z += 0.1 * Math.cos(this.direction) * timeScale;
            if (Math.hypot(this.state.memory.target.x - this.mesh.position.x, this.state.memory.target.z - this.mesh.position.z) < 0.25) {
                this.mesh.position.x = this.state.memory.target.x;
                this.mesh.position.z = this.state.memory.target.z;
                this.state = { type: "idle", memory: {} };
            }
            /*if (Math.random() < 0.001) {
                this.state = { type: "idle", memory: {} };
            }*/
        }
        if (occludingBoxes) {
            this.occludingBoxes = occludingBoxes;
        }
        this.box3.setFromCenterAndSize(new THREE.Vector3(0, 5 * this.size, 0).add(this.mesh.position), new THREE.Vector3(5 * this.size, 10 * this.size, 5 * this.size));
        //this.box3.applyMatrix4(this.mesh.matrix);
        let distToCamera = this.mesh.position.distanceToSquared(this.camera.position);

        let hide = false;
        if (!hide) {
            if (!frustum.intersectsBox(this.box3)) {
                hide = true;
            }
        }
        if (!hide) {
            if (Math.sqrt(distToCamera) > 200) {
                hide = true;
            }
        }
        if (!hide) {
            this.raycaster.set(this.camera.position, this.mesh.position.clone().sub(this.camera.position.clone()).normalize());
            for (let i = 0; i < this.occludingBoxes.length; i++) {
                const intersection = new THREE.Vector3();
                const doesIntersect = this.raycaster.ray.intersectBox(this.occludingBoxes[i], intersection);
                if (doesIntersect) {
                    const iDist = doesIntersect.distanceToSquared(this.camera.position);
                    if (iDist < distToCamera) {
                        hide = true;
                        break;
                    }
                }
            }
        }
        if (hide) {
            this.mesh.visible = false;
            if (this.mesh.matrixAutoUpdate) {
                this.mesh.updateMatrix();
            }
            if (this.added) {
                this.added = false;
                this.scene.children.splice(this.scene.children.indexOf(this.mesh), 1);
            }
            this.lodInstances.setMatrixAt(this.instanceIdx, this.mesh.matrix);
        } else {
            if (!this.added) {
                this.added = true;
                this.scene.add(this.mesh);
            }
            this.mesh.visible = true;
            this.mixer.update(delta / 1000);
            this.lodInstances.setMatrixAt(this.instanceIdx, this.oobMatrix);
        }
        this.foot1Matrix.copy(this.clearMatrix);
        const foot1Matrix = this.foot1Matrix;
        this.foot1.updateWorldMatrix(true, true);
        this.foot1Pos.setFromMatrixPosition(this.foot1.matrixWorld);
        const foot1Pos = this.foot1Pos;
        foot1Matrix.setPosition(foot1Pos.x - 0.3 * Math.sin(this.mesh.rotation.y) - 0.1 * Math.sin(this.mesh.rotation.y + Math.PI / 2), 0.1 + this.randomYOffset, foot1Pos.z - 0.3 * Math.cos(this.mesh.rotation.y) - 0.1 * Math.cos(this.mesh.rotation.y + Math.PI / 2));
        this.transformMatrix.copy(this.clearMatrix);
        this.transformMatrix.makeRotationY(this.mesh.rotation.y + Math.PI / 2);
        foot1Matrix.multiply(this.transformMatrix);
        this.transformMatrix.copy(this.clearMatrix);
        this.transformMatrix.makeRotationX(Math.PI / 2, 0, 0);
        foot1Matrix.multiply(this.transformMatrix);
        this.transformMatrix.copy(this.clearMatrix);
        this.transformMatrix.makeScale(1.7 * 1.5, 1 * 1.5, 1);
        foot1Matrix.multiply(this.transformMatrix);
        this.ambientInstances.setMatrixAt(this.ambientIdx, foot1Matrix);
        let colorFactor = Math.max(1 - 1.5 * foot1Pos.y, 0) * 1.0;
        this.ambientInstances.setColorAt(this.ambientIdx, new THREE.Color(colorFactor, colorFactor, colorFactor));
        this.foot2Matrix.copy(this.clearMatrix);
        const foot2Matrix = this.foot2Matrix;
        this.foot2.updateWorldMatrix(true, true);
        this.foot2Pos.setFromMatrixPosition(this.foot2.matrixWorld);
        const foot2Pos = this.foot2Pos;
        foot2Matrix.setPosition(foot2Pos.x - 0.3 * Math.sin(this.mesh.rotation.y) + 0.1 * Math.sin(this.mesh.rotation.y + Math.PI / 2), 0.1 + this.randomYOffset, foot2Pos.z - 0.3 * Math.cos(this.mesh.rotation.y) + 0.1 * Math.cos(this.mesh.rotation.y + Math.PI / 2));
        this.transformMatrix.copy(this.clearMatrix);
        this.transformMatrix.makeRotationY(this.mesh.rotation.y + Math.PI / 2);
        foot2Matrix.multiply(this.transformMatrix);
        this.transformMatrix.copy(this.clearMatrix);
        this.transformMatrix.makeRotationX(Math.PI / 2, 0, 0);
        foot2Matrix.multiply(this.transformMatrix);
        this.transformMatrix.copy(this.clearMatrix);
        this.transformMatrix.makeScale(1.7 * 1.5, 1 * 1.5, 1);
        foot2Matrix.multiply(this.transformMatrix);
        this.ambientInstances.setMatrixAt(this.ambientIdx + 1, foot2Matrix);
        colorFactor = Math.max(1 - 1.5 * foot2Pos.y, 0) * 1.0;
        this.ambientInstances.setColorAt(this.ambientIdx + 1, new THREE.Color(colorFactor, colorFactor, colorFactor));

    }
}
export default Robot;