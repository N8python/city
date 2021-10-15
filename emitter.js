import * as THREE from './three/build/three.module.js';
/* Particle Structure {
    position: Vector3,
    rotation: Vector3,
    scale: Vector3,
    speed: Number,
    size: Number,
    color: Color
    alpha: Number,
    slowDown: Number,
    billboard: Boolean,
    velocity: {
        position: Vector3,
        rotation: Vector3,
        scale: Vector3,
        speed: Number,
        size: Number,
        alpha: Number
    }
}*/
class Emitter extends THREE.Object3D {
    constructor(geometry, material, count, {
        deleteOnSize = -Infinity,
        deleteOnDark = -Infinity
    } = {}) {
        super();
        this.type = "Emitter";
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
        this.add(this.instancedMesh);
        this.count = count;
        this.particles = [];
        this.config = {
            deleteOnSize,
            deleteOnDark
        }
    }
    update(delta, camera) {
        const timeScale = (delta) / 16.6666;
        const transformMatrix = new THREE.Matrix4();
        const clearMatrix = new THREE.Matrix4();
        const xRot = new THREE.Matrix4();
        const yRot = new THREE.Matrix4();
        const zRot = new THREE.Matrix4();
        const scaleMatrix = new THREE.Matrix4();
        const oobMatrix = new THREE.Matrix4();
        oobMatrix.setPosition(1000000, 0, 0);
        const up = new THREE.Vector3(0.0, 1.0, 0.0);
        for (let j = 0; j < this.count; j++) {
            this.instancedMesh.setMatrixAt(j, oobMatrix);
        }
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            const localTimeScale = timeScale * particle.speed;
            particle.size = Math.max(particle.size, 0);
            particle.position.x += particle.velocity.position.x * localTimeScale;
            particle.position.y += particle.velocity.position.y * localTimeScale;
            particle.position.z += particle.velocity.position.z * localTimeScale;
            particle.rotation.x += particle.velocity.rotation.x * localTimeScale;
            particle.rotation.y += particle.velocity.rotation.y * localTimeScale;
            particle.rotation.z += particle.velocity.rotation.z * localTimeScale;
            particle.scale.x += particle.velocity.scale.x * localTimeScale;
            particle.scale.y += particle.velocity.scale.y * localTimeScale;
            particle.scale.z += particle.velocity.scale.z * localTimeScale;
            particle.speed += particle.velocity.speed;
            particle.size += particle.velocity.size;
            transformMatrix.copy(clearMatrix);
            transformMatrix.setPosition(particle.position);
            zRot.makeRotationZ(particle.rotation.z);
            if (particle.billboard) {
                transformMatrix.lookAt(this.position.clone().add(particle.position), camera.position, up);
            }
            xRot.makeRotationX(particle.rotation.x);
            yRot.makeRotationY(particle.rotation.y);
            scaleMatrix.makeScale(particle.scale.x * particle.size, particle.scale.y * particle.size, particle.scale.z * particle.size);
            transformMatrix.multiply(xRot);
            transformMatrix.multiply(yRot);
            transformMatrix.multiply(zRot);
            transformMatrix.multiply(scaleMatrix);
            this.instancedMesh.setMatrixAt(i, transformMatrix);
            particle.color.r *= particle.colorDecay;
            particle.color.g *= particle.colorDecay;
            particle.color.b *= particle.colorDecay;
            this.instancedMesh.setColorAt(i, particle.color);
        }
        for (let j = this.instancedMesh.length; j < this.count; j++) {
            this.instancedMesh.setMatrixAt(j, oobMatrix);
        }

        this.particles.forEach(particle => {
            if (particle.size < this.config.deleteOnSize) {
                this.particles.splice(this.particles.indexOf(particle), 1);
            } else if (particle.color.r < this.config.deleteOnDark && particle.color.g < this.config.deleteOnDark && particle.color.b < this.config.deleteOnDark) {
                this.particles.splice(this.particles.indexOf(particle), 1);
            }
        });
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.instanceColor.needsUpdate = true;
    }
    emit(particle) {
        this.particles.push(particle);
        if (this.particles.length > this.count) {
            this.particles.shift();
        }
    }
}
export default Emitter;