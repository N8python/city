import * as THREE from './three/build/three.module.js';
import {
    OrbitControls
} from './three/examples/jsm/controls/OrbitControls.js';
import Emitter from "./emitter.js";
import {
    Car
} from "./car.js";
import Robot from "./robot.js";
import generateCityData from './city-gen.js';
import {
    EffectComposer
} from './three/examples/jsm/postprocessing/EffectComposer.js';
import {
    RenderPass
} from './three/examples/jsm/postprocessing/RenderPass.js';
import {
    ShaderPass
} from './three/examples/jsm/postprocessing/ShaderPass.js';
import {
    FilmPass
} from './three/examples/jsm/postprocessing/FilmPass.js';
import {
    FXAAShader
} from './three/examples/jsm/shaders/FXAAShader.js';
import {
    UnrealBloomPass
} from './three/examples/jsm/postprocessing/UnrealBloomPass.js';
import {
    HorizontalBlurShader
} from './three/examples/jsm/shaders/HorizontalBlurShader.js';
import {
    VerticalBlurShader
} from './three/examples/jsm/shaders/VerticalBlurShader.js';
import {
    BloomShader
} from "./BloomShader.js";
import {
    BoxBlurShader
} from "./BoxBlurShader.js";
import {
    BloomAddShader
} from './BloomAddShader.js';
import {
    DefferedLighting
} from './DefferedLighting.js';
import {
    GLTFLoader
} from './three/examples/jsm/loaders/GLTFLoader.js';
import {
    FBXLoader
} from "./three/examples/jsm/loaders/FBXLoader.js";
import {
    SimplexNoise
} from "./three/examples/jsm/math/SimplexNoise.js";
const texLoader = new THREE.TextureLoader();
const fbxLoader = new FBXLoader();
const gltfLoader = new GLTFLoader();
const textures = {
    metalNormal: texLoader.load('./textures/metalnormalmap.jpeg'),
    roadTex: texLoader.load("./textures/roadtexture.png"),
    envMap: texLoader.load("./textures/envmap.jpeg"),
    envMapStreet: texLoader.load("./textures/envmapstreet.jpeg"),
    windowAlpha: texLoader.load("./textures/windowalpha.jpeg"),
    windowMetal: texLoader.load("./textures/windowmetalness.png"),
    windowNormal: texLoader.load("./textures/windownormal.jpeg"),
    buildingNormal: texLoader.load("./textures/buildingnormal.png"),
    buildingAO: texLoader.load("/textures/buildingao.png"),
    buildingAOSide: texLoader.load("./textures/buildingaoside.png"),
    carAO: texLoader.load("./textures/carAo.png"),
    windowGlow: texLoader.load("./textures/windowglow.png"),
    glassRoughness: texLoader.load("./textures/glassroughness.jpeg"),
    glassAlpha: texLoader.load("./textures/glassalpha.png"),
    glassMetal: texLoader.load("./textures/glassmetalness.png"),
    tire: texLoader.load("./textures/tire.png"),
    tireNormal: texLoader.load("./textures/normaltire.png"),
    tireMetal: texLoader.load("./textures/tiremetal.png"),
    smokeTexture: texLoader.load("./textures/smoke.jpeg"),
    footAO: texLoader.load("./textures/footao.png")
}
let noise = new SimplexNoise();
let robots = [];
let robotInstance;
const OpacityAOMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 1.0, 1.0),
    map: textures.footAO,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.SubtractiveBlending
});
const robotAmbientShadows = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), OpacityAOMat, 2000);
gltfLoader.load("robot.glb", async obj => {
    const anims = {
        idle: THREE.AnimationClip.parse(await (await fetch("animations/idle.json")).json()),
        walk: THREE.AnimationClip.parse(await (await fetch("animations/walk.json")).json())
    }
    let instances = await new Promise((resolve, reject) => {
        gltfLoader.load("facade.glb", obj => {
            obj.scene.children[0].material.color.r *= 5.5;
            obj.scene.children[0].material.color.g *= 5.5;
            obj.scene.children[0].material.color.b *= 5.5;
            obj.scene.children[0].material.envMap = textures.envMap;
            obj.scene.children[0].material.normalMap = textures.buildingNormal;
            obj.scene.children[0].material.metalness = 0.75;
            obj.scene.children[0].material.roughness = 0.5;
            obj.scene.children[0].material.needsUpdate = true;
            const scaleRot = new THREE.Matrix4();
            scaleRot.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
            scaleRot.multiply(new THREE.Matrix4().makeScale(0.01, 0.01, 0.01));
            obj.scene.children[0].geometry.applyMatrix4(scaleRot);
            resolve(new THREE.InstancedMesh(obj.scene.children[0].geometry, obj.scene.children[0].material, 1000));
        });
    });
    obj.scene.traverse((child) => {
        if (child.isMesh) {
            child.frustumCulled = false;
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.envMap = textures.envMap;
            if (child.material.metalness < 0.75) {
                child.material.normalMap = textures.buildingNormal;
            }
            child.material.color.r *= 2.0;
            child.material.color.g *= 2.0;
            child.material.color.b *= 2.0;
            child.material.needsUpdate = true;
        }
    });
    const robotRaycaster = new THREE.Raycaster();
    for (let i = 0; i < 1000; i++) {
        let x;
        let z;
        while (true) {
            x = 500 - 1000 * Math.random();
            z = 500 - 1000 * Math.random();
            if (Math.hypot(x, z) <= 500) {
                let contained = false;
                const ptVector = new THREE.Vector3(x, 1, z);
                for (let i = 0; i < buildingBoxes.length; i++) {
                    if (buildingBoxes[i].containsPoint(ptVector)) {
                        contained = true;
                        break;
                    }
                }
                if (!contained) {
                    break;
                }
            }
        }
        const robot = new Robot(obj, {
            position: new THREE.Vector3(x, 0.0, z),
            direction: 2 * Math.PI * Math.random(),
            anims,
            startState: "idle",
            occludingBoxes: buildingBoxes,
            camera,
            raycaster: robotRaycaster,
            lodInstances: instances,
            instanceIdx: i,
            ambientInstances: robotAmbientShadows,
            ambientIdx: i * 2
        }, scene);
        robots.push(robot);
    }
    robotInstance = instances;
    instances.castShadow = true;
    instances.receiveShadow = true;
    scene.add(instances);
    scene.add(robotAmbientShadows);
});
/*gltfLoader.load("walk.glb", obj => {
    console.log(JSON.stringify(obj.animations[0]));
})*/
textures.metalNormal.wrapS = THREE.RepeatWrapping;
textures.metalNormal.wrapT = THREE.RepeatWrapping;
textures.metalNormal.repeat.set(8, 8);
textures.envMap.mapping = THREE.EquirectangularReflectionMapping;
textures.envMap.encoding = THREE.sRGBEncoding;
textures.envMapStreet.mapping = THREE.EquirectangularReflectionMapping;
textures.envMapStreet.encoding = THREE.sRGBEncoding;
const scene = new THREE.Scene();
let scalingFactor = 1;
const rWidth = window.innerWidth * (0.9875 / scalingFactor);
const rHeight = window.innerHeight * (0.975 / scalingFactor);
const camera = new THREE.PerspectiveCamera(75, rWidth / rHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
    logarithmicDepthBuffer: true
});
//textures.metalNormal.anisotropy = 16;
textures.roadTex.anisotropy = 16;
textures.buildingNormal.anisotropy = 16;
renderer.setSize(rWidth, rHeight);
renderer.domElement.style.width = rWidth * scalingFactor + "px";
renderer.domElement.style.height = rHeight * scalingFactor + "px";
renderer.domElement.style.imageRendering = "auto";
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
//renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const skyboxSize = 500;
const geometry = new THREE.SphereGeometry(skyboxSize, 32, 32);
const material = new THREE.ShaderMaterial({
    uniforms: {
        time: {
            value: 0.0
        },
        logDepthBufferFC: {
            value: 2.0 / (Math.log(camera.far + 1) / Math.LN2)
        },
        playerPos: {
            value: new THREE.Vector3()
        }
    },
    vertexShader: /* glsl */ `
    varying vec4 worldPos;
    varying float vFragDepth;
    void main() {
        worldPos = modelMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * viewMatrix * worldPos;
        vFragDepth = 1.0 + gl_Position.w;
    }
    `,
    fragmentShader: /* glsl */ `
    uniform float time;
    uniform float logDepthBufferFC;
    uniform vec3 playerPos;
    varying vec4 worldPos;
    varying float vFragDepth;
    float rand(vec2 n) { 
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }
    float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
    vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
    
    float noise(vec3 p){
        vec3 a = floor(p);
        vec3 d = p - a;
        d = d * d * (3.0 - 2.0 * d);
    
        vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
        vec4 k1 = perm(b.xyxy);
        vec4 k2 = perm(k1.xyxy + b.zzww);
    
        vec4 c = k2 + a.zzzz;
        vec4 k3 = perm(c);
        vec4 k4 = perm(c + 1.0);
    
        vec4 o1 = fract(k3 * (1.0 / 41.0));
        vec4 o2 = fract(k4 * (1.0 / 41.0));
    
        vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
        vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
    
        return o4.y * d.y + o4.x * (1.0 - d.y);
    }
float fbm(vec3 x) {
	float v = 0.0;
	float a = 0.5;
	vec3 shift = vec3(100);
	for (int i = 0; i < 5; ++i) {
		v += a * noise(x);
		x = x * 2.0 + shift;
		a *= 0.5;
	}
	return v;
}  
float cloud_noise(vec3 x, vec3 pos) {
    return fbm(x);
}
    void main() {
        float daynightCycleTime = time * 0.1;
        float cloudTime = time * 0.05;
        vec3 pos = (worldPos.xyz - playerPos) / ${skyboxSize.toFixed(2)};
        vec3 moonPos = vec3(-cos(3.1415 / 8.0) * sin(daynightCycleTime + 3.14159), cos(daynightCycleTime + 3.14159),sin(3.1415 / 8.0) * sin(daynightCycleTime  + 3.14159));
        vec3 dirToMoon = normalize(pos - moonPos);
        vec4 moonCol;
        float skyColTier = fbm(pos / 2.0);
        if (skyColTier < 0.33) {
            moonCol = mix(vec4(7.0 / 255.0, 11.0 / 255.0, 52.0 / 255.0, 1.0),vec4(17.0 / 255.0, 18.0 / 255.0, 47.0 / 255.0, 1.0), skyColTier / 0.33);
        } else if (skyColTier < 0.67) {
            moonCol = mix(vec4(17.0 / 255.0, 18.0 / 255.0, 47.0 / 255.0, 1.0), vec4(28.0 / 255.0, 20.0 / 255.0, 46.0 / 255.0, 1.0), (skyColTier - 0.33) / 0.33);
        } else {
            moonCol = mix(vec4(28.0 / 255.0, 20.0 / 255.0, 46.0 / 255.0, 1.0), vec4(7.0 / 255.0, 11.0 / 255.0, 52.0 / 255.0, 1.0), (skyColTier - 0.67) / 0.33);
        }
        float starNoise = noise(pos * 100.0);
        if (starNoise > 0.9) {
            moonCol = mix(moonCol, vec4(1.0, 1.0, 1.0, 1.0), ((starNoise - 0.9) / 0.1));
        }
        float moonDist = length(moonPos - pos);
        if (moonDist < 0.1) {
            float moonPower = max(min(pow( 1.0 - (moonDist / 0.1), 1.0), 1.0), 0.0);
            if (moonDist < 0.05) {
                moonPower = 1.0;
                moonCol = mix(moonCol, vec4(vec3(0.8, 0.8, 0.8) * (0.4 + 0.6 * fbm((pos - moonPos) * 60.0 + 100.0)), 1.0), pow(moonPower, 1.75));
            } else {
                moonCol = mix(moonCol, vec4(1.0, 1.0, 1.0, 1.0), pow(moonPower, 1.75));
            }
        }
        vec3 sunPos = vec3(-cos(3.1415 / 8.0) * sin(daynightCycleTime), cos(daynightCycleTime),sin(3.1415 / 8.0) * sin(daynightCycleTime));
        vec3 dirToLight = normalize(pos - sunPos);
        vec3 cloudSamplePoint = vec3(pos.x + cloudTime, pos.y, pos.z + cloudTime) * 5.0;
        const float EPSILON = 0.5;
        vec4 sunCol = vec4(0.0, 0.4 + 0.2 * length(pos.xz), 1.0, 1.0);
        float skyNoise = cloud_noise(cloudSamplePoint, pos) * max((1.0 - pow(abs(pos.y), 5.0)), 0.9);
        float sunDist = length(sunPos - pos);
        if (sunDist < 0.4) {
            float sunPower = max(min(pow((0.3 - (sunDist - 0.1)) / 0.3, 1.0), 1.0), 0.0);
            sunCol = mix(sunCol, vec4(1.0, 1.0, 0.9, 1.0), pow(sunPower, 1.75));
        }
        if (skyNoise > 0.4) {
            float cloudColor = 1.0;
            vec3 cloudNormal = vec3(
                cloud_noise(cloudSamplePoint + vec3(EPSILON, 0.0, 0.0), pos) - cloud_noise(cloudSamplePoint - vec3(EPSILON, 0.0, 0.0), pos),
                cloud_noise(cloudSamplePoint + vec3(0.0, EPSILON, 0.0), pos) - cloud_noise(cloudSamplePoint - vec3(0.0, EPSILON, 0.0), pos),
                cloud_noise(cloudSamplePoint + vec3(0.0, 0.0,EPSILON), pos) - cloud_noise(cloudSamplePoint - vec3(0.0, 0.0, EPSILON), pos)
            );
            sunCol = mix(sunCol, vec4(1.0, 1.0, 1.0, 1.0) * cloudColor * (0.2 + 0.8 * ((dot(dirToLight, cloudNormal) + 1.0) / 2.0)), min((skyNoise - 0.4) / 0.2, 1.0));
            moonCol =  mix(moonCol, vec4(1.0, 1.0, 1.0, 1.0) * cloudColor * (0.2 + 0.8 * ((dot(dirToMoon, cloudNormal) + 1.0) / 2.0)), min((skyNoise - 0.4) / 0.2, 1.0) * 0.1);
        } else {
            sunCol = sunCol;
        }
        float cycleWeight = (atan(8.0 * sin(daynightCycleTime - 3.1415926535 / 2.0)) / atan(8.0) + 1.0) / 2.0;
        float sunset = (exp(-pow((cycleWeight - 0.5), 2.0))-0.779) * (1.0 / (1.0 - 0.779));
        gl_FragColor = mix(sunCol, moonCol, cycleWeight);
        // Red band
        gl_FragColor.r *= 1.0 + sunset * exp(-10.0 * pos.y * pos.y) * 0.5;
        // Yellow Band
        float yellowYPos = abs(abs(pos.y) - 0.3);
        gl_FragColor.r *= 1.0 + sunset * exp(-10.0 * yellowYPos * yellowYPos) * 0.5;
        gl_FragColor.g *= 1.0 + sunset * exp(-10.0 * yellowYPos * yellowYPos) * 0.5;
        // Purple Band
        float purpleYPos = abs(abs(pos.y) - 0.6);
        gl_FragColor.r *= 1.0 + sunset * exp(-10.0 * purpleYPos * purpleYPos) * 0.25;
        gl_FragColor.b *= 1.0 + sunset * exp(-10.0 * purpleYPos * purpleYPos) * 0.5;
           // gl_FragDepth = log2(vFragDepth) * logDepthBufferFC * 0.5;
    }
    `,
    side: THREE.DoubleSide

});
const skybox = new THREE.Mesh(geometry, material);
scene.add(skybox);
const groundGeo = new THREE.BoxGeometry(1000, 500, 1000);
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x999999,
    side: THREE.DoubleSide,
    normalMap: textures.metalNormal
});
const groundMesh = new THREE.Mesh(groundGeo, groundMat);
groundMesh.receiveShadow = true;
const sunLight = new THREE.DirectionalLight(0xffffff, 0.5);
sunLight.color.setRGB(1.0, 1.0, 1.0);
scene.add(sunLight);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 4096;
sunLight.shadow.mapSize.height = 4096;
const d = 350;
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.camera.near = 0.1;
sunLight.shadow.camera.far = 1000;
sunLight.shadow.bias = -0.001;
sunLight.shadow.blurSamples = 8;
sunLight.shadow.radius = 4;
scene.add(sunLight.target);
const moonLight = new THREE.DirectionalLight(0xffffff, 0.2);
scene.add(moonLight);
/*const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.color.setHSL(0.1, 1, 0.95);
dirLight.position.set(-1, 1.75, 1);
dirLight.position.multiplyScalar(30);
scene.add(dirLight);

dirLight.castShadow = true;

dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;


dirLight.shadow.camera.left = -d;
dirLight.shadow.camera.right = d;
dirLight.shadow.camera.top = d;
dirLight.shadow.camera.bottom = -d;

dirLight.shadow.camera.far = 3500;
dirLight.shadow.bias = -0.0001;

const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 10);
scene.add(dirLightHelper);*/

const helper = new THREE.CameraHelper(sunLight.shadow.camera, 10);
//scene.add(helper);
const ambientLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5);
ambientLight.color.setRGB(0.6, 0.6, 0.6);
ambientLight.groundColor.setRGB(0.3, 0.3, 0.3);
ambientLight.position.set(0, 50, 0);
scene.add(ambientLight);
groundMesh.position.y = -250;
scene.add(groundMesh);
const testSphere = new THREE.SphereGeometry(10, 32, 32);
const testMaterial = new THREE.MeshPhongMaterial({
    color: 0x0000ff
});
const testMesh = new THREE.Mesh(testSphere, testMaterial);
testMesh.position.y = 25;
testMesh.castShadow = true;
testMesh.receiveShadow = true;
//scene.add(testMesh);
const cityData = generateCityData({
    size: 100,
    roadSeeds: 100,
    buildings: 250
});
const roadPlane = new THREE.BufferGeometry();
/*for (let i = 0; i < roadPlane.attributes.position.count; i++) {
    const x = roadPlane.attributes.position.getX(i);
    const y = roadPlane.attributes.position.getY(i);
}*/
const indices = [];
const vertices = [];
const normals = [];
const uvs = [];
for (let x = -50; x < 50; x++) {
    for (let z = -50; z < 50; z++) {
        if (cityData.directionMap[(x + 50) * 100 + (z + 50)] > 0) {
            //console.log(cityData.roadMap[(x + 50) * 100 + (z + 50)]);
            const roadPart = cityData.roadMap[(x + 50) * 100 + (z + 50)];
            const xStart = 0.25 * Math.floor(roadPart / 4);
            const yStart = 0.75 - 0.25 * (roadPart % 4);
            vertices.push([x * 10, 0, z * 10]);
            normals.push([0, 1, 0])
            uvs.push([xStart, yStart]);
            vertices.push([x * 10 + 10, 0, z * 10]);
            normals.push([0, 1, 0])
            uvs.push([xStart + 0.25, yStart]);
            vertices.push([x * 10 + 10, 0, z * 10 + 10]);
            normals.push([0, 1, 0])
            uvs.push([xStart + 0.25, yStart + 0.25]);
            vertices.push([x * 10, 0, z * 10 + 10]);
            normals.push([0, 1, 0])
            uvs.push([xStart, yStart + 0.25]);
            indices.push([vertices.length - 4, vertices.length - 1, vertices.length - 2]);
            indices.push([vertices.length - 4, vertices.length - 2, vertices.length - 3]);
        }
    }
}
roadPlane.setIndex(indices.flat());
roadPlane.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
roadPlane.setAttribute('normal', new THREE.Float32BufferAttribute(normals.flat(), 3));

roadPlane.setAttribute('uv', new THREE.Float32BufferAttribute(uvs.flat(), 2));
//roadPlane.computeVertexNormals();
const roadMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: textures.roadTex,
    // transparent: true,
    side: THREE.DoubleSide
})
const roadMesh = new THREE.Mesh(roadPlane, roadMaterial);
roadMesh.receiveShadow = true;
//roadMesh.rotation.x = Math.PI / 2;
roadMesh.position.y = 0.09;
//roadMesh.scale.z = -1;
//roadMesh.scale.y = -1;
//roadMesh.scale.z = -1;
scene.add(roadMesh);
const createWindow = ({
    width,
    height,
    normal,
    alpha,
    metal,
    env,
    color
}) => {
    const geometry = new THREE.PlaneGeometry(width, height);
    const windowMat = new THREE.MeshStandardMaterial({
        color,
        normalMap: normal,
        alphaMap: alpha,
        metalnessMap: metal,
        transparent: true,
        side: THREE.DoubleSide,
        envMap: env,
        metalness: 1.0,
        roughness: 0.175
    });
    const window = new THREE.Mesh(geometry, windowMat);
    return window;
}
const createWindowGlow = ({
        width,
        height,
    }) => {
        const geometry = new THREE.PlaneGeometry(width, height);
        const windowMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(4.0, 4.0, 0.0),
            transparent: true,
            side: THREE.DoubleSide,
            map: textures.windowGlow,
            blending: THREE.AdditiveBlending
        });
        const window = new THREE.Mesh(geometry, windowMat);
        return window;
    }
    /*scene.add(createWindow({
        width: 100,
        height: 100,
        normal: textures.windowNormal,
        alpha: textures.windowAlpha,
        metal: textures.windowMetalness,
        env: textures.envMap
    }))*/
const buildingMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    normalMap: textures.metalNormal,
    //vertexColors: true
});
let colors = [
    [1.0, 1.0, 1.0],
    [0.85, 0.85, 0.85],
    [0.75, 0.75, 0.75],
    [0.65, 0.65, 0.65],
    [1.0, 0.95, 0.9],
    [0.7, 0.6, 0.6],
    [0.8, 0.7, 0.7]
]
let windowColors = [
    [1.0, 1.0, 1.0],
    [0.8, 0.8, 0.8],
    [0.9, 0.9, 0.9],
    [0.45 / 2, 0.37 / 2, 0.32 / 2],
    [0.3, 0.3, 0.3],
    [0.7, 0.7, 0.7],
    [1.1, 1.1, 1.1],
    [0.8, 0.77, 0.65]
]
const AOMat = new THREE.MeshStandardMaterial({
    color: 0,
    alphaMap: textures.buildingAO,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0.4
});
const SideAOMat = new THREE.MeshStandardMaterial({
    color: 0,
    alphaMap: textures.buildingAOSide,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: false,
    opacity: 0.4
});
const TrueAOMat = new THREE.MeshStandardMaterial({
    color: 0,
    alphaMap: textures.carAO,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: true,
    depthWrite: false,
    opacity: 0.4
});
const spireMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 1.0, 1.0),
    metalness: 0.6,
    roughness: 0.25,
    normalMap: textures.buildingNormal,
    envMap: textures.envMap,
    side: THREE.DoubleSide
});

const TrueAOGeo = new THREE.PlaneGeometry(1, 1);
const AOInstances = new THREE.InstancedMesh(TrueAOGeo, TrueAOMat, (cityData.buildings.length * 2) + 100);
let currAOIdx = 0;
const AOSideInstances = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), SideAOMat, cityData.buildings.length * 4);
let aosideidx = 0;
let smokestacks = [];
const BuildingMeshInstances = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), buildingMaterial, cityData.buildings.length);
let windowsAmt = 0;
let spireAmt = 0;
cityData.buildings.forEach(building => {
    building.verticalHeight = 30 + Math.random() ** 2 * 200;
    let winX = building.height - 1;
    if (winX < 1) {
        winX = 0;
    }
    let winZ = building.width - 1;
    if (winZ < 1) {
        winZ = 0;
    }
    let winY = Math.floor(building.verticalHeight / 20);
    windowsAmt += (winX + 2) * 2 * (winY + 2) + (winZ + 2) * 2 * (winY + 2);
    building.spire = building.verticalHeight > 100 && Math.random() < 0.5;
    if (building.spire) {
        spireAmt++;
    }
});
const blueprintWindow = createWindow({
    width: 5,
    height: 10,
    normal: textures.windowNormal,
    alpha: textures.windowAlpha,
    env: textures.envMap,
    metal: textures.windowMetal,
    color: [1.0, 1.0, 1.0]
});
const blueprintWindowGlow = createWindowGlow({
    width: 5,
    height: 10
});
const windowInstancedGeo = new THREE.InstancedMesh(blueprintWindow.geometry, blueprintWindow.material, windowsAmt);
const windowInstancedGeoGlow = new THREE.InstancedMesh(blueprintWindowGlow.geometry, blueprintWindowGlow.material, windowsAmt);
const windowInstancedGeoGlow2 = new THREE.InstancedMesh(blueprintWindowGlow.geometry, new THREE.MeshStandardMaterial({
    color: new THREE.Color(4.0, 4.0, 0.0),
    transparent: true,
    side: THREE.DoubleSide,
    map: textures.windowGlow,
    blending: THREE.NormalBlending
}), windowsAmt);
const spireGeometry = new THREE.BoxGeometry(1, 1, 1);
const instancedSpire = new THREE.InstancedMesh(spireGeometry, spireMaterial, spireAmt);
let buildingGlowers = [windowInstancedGeoGlow];
let buildingBoxes = [];
let windowidx = 0;
let buildingmeshidx = 0;
let spireidx = 0;
cityData.buildings.forEach(building => {
    let height = building.verticalHeight;
    //const buildingGeo = new THREE.BoxGeometry(building.height * 10, height, building.width * 10);
    const colorList = [];
    let color = colors[Math.floor(Math.random() * colors.length)];
    if (height > 170 && Math.random() < 0.25) {
        color = [1.75, 1.75, 1.75];
    }
    if (height < 80 && Math.random() < 0.25) {
        color = [0.45, 0.37, 0.32];
    }
    let windowColor = windowColors[Math.floor(Math.random() * windowColors.length)];
    /*for (let i = 0; i < buildingGeo.attributes.position.count; i++) {
        colorList.push(color);
    }*/
    const buildingMatrix = new THREE.Matrix4();
    // buildingGeo.setAttribute('color', new THREE.Float32BufferAttribute(colorList.flat(), 3));
    //const buildingMesh = new THREE.Mesh(buildingGeo, buildingMaterial);
    const buildingMesh = new THREE.Object3D();
    buildingMesh.position.x = (building.positionX + building.height * 0.5) * 10;
    buildingMesh.position.z = (building.positionZ + building.width * 0.5) * 10;
    buildingMesh.position.y = height / 2;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    buildingMatrix.setPosition((building.positionX + building.height * 0.5) * 10, height / 2, (building.positionZ + building.width * 0.5) * 10);
    buildingMatrix.multiply(new THREE.Matrix4().makeScale(building.height * 10, height, building.width * 10));
    BuildingMeshInstances.setMatrixAt(buildingmeshidx, buildingMatrix);
    BuildingMeshInstances.setColorAt(buildingmeshidx, new THREE.Color(...color));
    buildingBoxes.push(new THREE.Box3().setFromCenterAndSize(
        new THREE.Vector3((building.positionX + building.height * 0.5) * 10, height / 2, (building.positionZ + building.width * 0.5) * 10),
        new THREE.Vector3(building.height * 10, height, building.width * 10)
    ))
    buildingmeshidx++;
    const blueprintWindow = createWindow({
        width: 5,
        height: 10,
        normal: textures.windowNormal,
        alpha: textures.windowAlpha,
        env: textures.envMap,
        metal: textures.windowMetal,
        color: new THREE.Color(...windowColor)
    });
    const blueprintWindowGlow = createWindowGlow({
        width: 5,
        height: 10
    });
    let winX = building.height - 1;
    if (winX < 1) {
        winX = 0;
    }
    let winZ = building.width - 1;
    if (winZ < 1) {
        winZ = 0;
    }
    let winY = Math.floor(height / 20);
    //const windowInstancedGeo = new THREE.InstancedMesh(blueprintWindow.geometry, blueprintWindow.material, (winX + 2) * 2 * (winY + 2) + (winZ + 2) * 2 * (winY + 2));
    //const windowInstancedGeoGlow = new THREE.InstancedMesh(blueprintWindowGlow.geometry, blueprintWindowGlow.material, (winX + 2) * 2 * (winY + 2) + (winZ + 2) * 2 * (winY + 2));
    let idx = 0;
    for (let x = 0; x <= winX; x++) {
        for (let y = 0; y <= winY; y++) {
            const matrix = new THREE.Matrix4();
            matrix.setPosition(
                (winX === 0 ? 0.5 : x) * (building.height * 10 / Math.max(winX, 1)) * 0.5 - building.height * 2.5 + buildingMesh.position.x,
                (y / winY) * (height - 20) - (height * 0.5 - 10) + buildingMesh.position.y,
                building.width * 5.05 + buildingMesh.position.z
            );
            idx++;
            windowInstancedGeo.setMatrixAt(windowidx, matrix);
            const matrix2 = new THREE.Matrix4();
            matrix2.makeScale(0.0001, 1.0, 0.0001);
            matrix.multiply(matrix2);
            windowInstancedGeoGlow.setMatrixAt(windowidx, matrix);
            windowInstancedGeoGlow2.setMatrixAt(windowidx, matrix);
            windowidx++;
        }
    }
    for (let x = 0; x <= winX; x++) {
        for (let y = 0; y <= winY; y++) {
            const matrix = new THREE.Matrix4();
            matrix.setPosition(
                (winX === 0 ? 0.5 : x) * (building.height * 10 / Math.max(winX, 1)) * 0.5 - building.height * 2.5 + buildingMesh.position.x,
                (y / winY) * (height - 20) - (height * 0.5 - 10) + buildingMesh.position.y, -building.width * 5.05 + buildingMesh.position.z
            );
            idx++;
            windowInstancedGeo.setMatrixAt(windowidx, matrix);
            const matrix2 = new THREE.Matrix4();
            matrix2.makeScale(0.0001, 1.0, 0.0001);
            matrix.multiply(matrix2);
            windowInstancedGeoGlow.setMatrixAt(windowidx, matrix);
            windowInstancedGeoGlow2.setMatrixAt(windowidx, matrix);
            windowidx++;
        }
    }
    for (let z = 0; z <= winZ; z++) {
        for (let y = 0; y <= winY; y++) {
            const matrix = new THREE.Matrix4();
            matrix.makeRotationY(Math.PI / 2);
            matrix.setPosition(
                building.height * 5.05 + buildingMesh.position.x,
                (y / winY) * (height - 20) - (height * 0.5 - 10) + buildingMesh.position.y,
                (winZ === 0 ? 0.5 : z) * (building.width * 10 / Math.max(winZ, 1)) * 0.5 - building.width * 2.5 + buildingMesh.position.z,
            );
            idx++;
            windowInstancedGeo.setMatrixAt(windowidx, matrix);
            const matrix2 = new THREE.Matrix4();
            matrix2.makeScale(0.0001, 1.0, 0.0001);
            matrix.multiply(matrix2);
            windowInstancedGeoGlow.setMatrixAt(windowidx, matrix);
            windowInstancedGeoGlow2.setMatrixAt(windowidx, matrix);
            windowidx++;
        }
    }
    for (let z = 0; z <= winZ; z++) {
        for (let y = 0; y <= winY; y++) {
            const matrix = new THREE.Matrix4();
            matrix.makeRotationY(Math.PI / 2);
            matrix.setPosition(-building.height * 5.05 + buildingMesh.position.x,
                (y / winY) * (height - 20) - (height * 0.5 - 10) + buildingMesh.position.y,
                (winZ === 0 ? 0.5 : z) * (building.width * 10 / Math.max(winZ, 1)) * 0.5 - building.width * 2.5 + buildingMesh.position.z,
            );
            idx++;
            windowInstancedGeo.setMatrixAt(windowidx, matrix);
            const matrix2 = new THREE.Matrix4();
            matrix2.makeScale(0.0001, 1.0, 0.0001);
            matrix.multiply(matrix2);
            windowInstancedGeoGlow.setMatrixAt(windowidx, matrix);
            windowInstancedGeoGlow2.setMatrixAt(windowidx, matrix);
            windowidx++;
        }
    }
    //windowInstancedGeoGlow.renderOrder = 2;
    //windowInstancedGeoGlow.visible = false;
    //buildingMesh.add(windowInstancedGeo);
    //buildingMesh.add(windowInstancedGeoGlow);
    //buildingGlowers.push(windowInstancedGeoGlow);
    if (building.spire) {
        let spireHeight = height * (0.2 + Math.random() * 0.2);
        /* const spireGeometry = new THREE.BoxGeometry(2 + Math.random() * 1, spireHeight, 2 + Math.random() * 1);
         const spire = new THREE.Mesh(spireGeometry, spireMaterial);
         spire.position.y = height / 2 + spireHeight / 2 - 5;
         spire.castShadow = true;*/
        const spireMatrix = new THREE.Matrix4();
        spireMatrix.setPosition(
            buildingMesh.position.x,
            buildingMesh.position.y + height / 2 + spireHeight / 2 - 5,
            buildingMesh.position.z
        );
        const xScale = 2 + Math.random() * 1;
        const zScale = 2 + Math.random() * 1;
        spireMatrix.multiply(new THREE.Matrix4().makeScale(xScale, spireHeight, zScale));
        instancedSpire.setMatrixAt(spireidx, spireMatrix);
        const AOMatrix = new THREE.Matrix4();
        AOMatrix.setPosition(buildingMesh.position.x,
            buildingMesh.position.y + height / 2 + 0.05,
            buildingMesh.position.z);
        AOMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        AOMatrix.multiply(new THREE.Matrix4().makeScale(xScale * 1.3, zScale * 1.3, 1.0));
        AOInstances.setMatrixAt(currAOIdx, AOMatrix);
        currAOIdx++;
        spireidx++;
        if (Math.random() < 0.25) {
            smokestacks.push({
                position: new THREE.Vector3(buildingMesh.position.x, height + spireHeight, buildingMesh.position.z),
                direction: new THREE.Vector3((0.1 + 0.1 * Math.random()) * Math.sign(Math.random() - 0.5), 0.05 - 0.1 * Math.random(), (0.1 + 0.1 * Math.random()) * Math.sign(Math.random() - 0.5))
            });
        }
        //buildingMesh.add(spire);
    }
    /*const AOGeo = new THREE.PlaneGeometry(1, 1);
    const AOMesh = new THREE.Mesh(AOGeo, AOMat);
    AOMesh.rotation.x = Math.PI / 2;
    AOMesh.scale.x = building.height * 12.5;
    AOMesh.scale.y = building.width * 12.5;
    AOMesh.position.y = -height / 2 + 0.1;*/
    const AOMatrix = new THREE.Matrix4();
    AOMatrix.setPosition((building.positionX + building.height * 0.5) * 10, 0.1, (building.positionZ + building.width * 0.5) * 10);
    AOMatrix.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    AOMatrix.multiply(new THREE.Matrix4().makeScale(building.height * 12.5, building.width * 12.5, 1.0));
    AOInstances.setMatrixAt(currAOIdx, AOMatrix);
    currAOIdx++;
    //buildingMesh.add(AOMesh);
    const AOSideGeo = new THREE.PlaneGeometry(1, 1);
    const AOSide = new THREE.Mesh(AOSideGeo, SideAOMat);
    /*const mat1 = new THREE.Matrix4();
    mat1.makeScale(building.height * 10, 2.5, 1.0);
    mat1.setPosition(0, -height / 2 + 1.25,
        building.width * 5.025
    );
    AOSide1.matrix = mat1;
    scene.add(AOSide1);*/
    //const instancedAOSide = new THREE.InstancedMesh(AOSide.geometry, AOSide.material, 4);
    const mat1 = new THREE.Matrix4();
    mat1.makeScale(building.height * 10, 2.5, 1.0);
    mat1.setPosition(buildingMesh.position.x, buildingMesh.position.y + -height / 2 + 1.25,
        buildingMesh.position.z + building.width * 5.025
    );
    AOSideInstances.setMatrixAt(aosideidx, mat1);
    aosideidx++;
    const mat2 = new THREE.Matrix4();
    mat2.makeScale(building.height * 10, 2.5, 1.0);
    mat2.setPosition(buildingMesh.position.x, buildingMesh.position.y - height / 2 + 1.25, buildingMesh.position.z - building.width * 5.025);
    AOSideInstances.setMatrixAt(aosideidx, mat2);
    aosideidx++;
    const mat3 = new THREE.Matrix4();
    mat3.makeScale(1.0, 2.5, building.width * 10);
    //mat4.makeRotationY()
    mat3.setPosition(buildingMesh.position.x + building.height * 5.025, buildingMesh.position.y - height / 2 + 1.25,
        buildingMesh.position.z
    );
    mat3.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
    AOSideInstances.setMatrixAt(aosideidx, mat3);
    aosideidx++;
    const mat4 = new THREE.Matrix4();
    mat4.makeScale(1.0, 2.5, building.width * 10);
    //mat4.makeRotationY()
    mat4.setPosition(buildingMesh.position.x - building.height * 5.025, buildingMesh.position.y - height / 2 + 1.25,
        buildingMesh.position.z
    );
    mat4.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
    AOSideInstances.setMatrixAt(aosideidx, mat4);
    aosideidx++;
    //buildingMesh.add(instancedAOSide);
    scene.add(buildingMesh);
});
/*buildingBoxes.forEach(box => {
    const helper = new THREE.Box3Helper(box, 0xffffff);
    scene.add(helper);
})*/
BuildingMeshInstances.castShadow = true;
BuildingMeshInstances.receiveShadow = true;
instancedSpire.castShadow = true;
instancedSpire.receiveShadow = true;
windowInstancedGeo.renderOrder = 1;
windowInstancedGeoGlow.renderOrder = 2;
scene.add(AOSideInstances);
scene.add(BuildingMeshInstances);
scene.add(windowInstancedGeo);
scene.add(windowInstancedGeoGlow);
scene.add(instancedSpire);
/*const light = new THREE.PointLight(0xff00ff, 1, 50);
light.position.set(0, 10, 0);
scene.add(light);*/
let cars = [];
currAOIdx++;
for (let i = 0; i < 100; i++) {
    const testCar = new Car({
        env: textures.envMapStreet,
        rrough: textures.glassRoughness,
        rnormal: textures.buildingNormal,
        ralpha: textures.glassAlpha,
        rmetal: textures.glassMetal,
        tire: textures.tire,
        tireNormal: textures.tireNormal,
        tireMetal: textures.tireMetal,
        aoMat: textures.carAO,
        aoSource: AOInstances,
        aoIdx: currAOIdx,
        size: 10
    });
    currAOIdx++;
    //testCar.mesh.scale.set(10, 10, 10);
    let x;
    let z;
    while (true) {
        x = Math.floor((-50 + Math.random() * 100));
        z = Math.floor((-50 + Math.random() * 100));
        if (cityData.directionMap[(x + 50) * 100 + (z + 50)] > 0) {
            testCar.mesh.position.set(x * 10 + 5, 5, z * 10 + 5);
            /*if (cityData.directionMap[(x + 50) * 100 + (z + 50)] % 2 === 0) {
                testCar.mesh.rotation.y = Math.PI / 2;
            }
            if (Math.random() <= 0.5) {
                testCar.mesh.rotation.y += Math.PI;
            }*/
            break;
        }
    }
    cars.push(testCar);
    scene.add(testCar.mesh);
}
scene.add(AOInstances);
//scene.overrideMaterial = new THREE.MeshBasicMaterial({ color: 0 });
const smokeMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
    alphaMap: textures.smokeTexture,
    depthTest: true,
    depthWrite: false,
});
/*for (let i = 0; i < smokestacks.length; i++) {
    const position = smokestacks[i];
    smokestacks[i] = new Emitter(new THREE.PlaneGeometry(1, 1), smokeMaterial, 2000, {
        deleteOnSize: 0.001,
        deleteOnDark: 0.01
    });
    smokestacks[i].position.copy(position);
    scene.add(smokestacks[i]);

}*/
const smokeEmitter = new Emitter(new THREE.PlaneGeometry(1, 1), smokeMaterial, 2000 * smokestacks.length, {
    deleteOnSize: 0.001,
    deleteOnDark: 0.01
});
scene.add(smokeEmitter);
const controls = new OrbitControls(camera, renderer.domElement);
controls.maxDistance = 450;
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = true;
camera.position.z = -5.0;
camera.position.y = 0.0;
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const bloomScene = new THREE.Scene();
bloomScene.add(new THREE.AmbientLight(0xffffff, 0.75));
bloomScene.add(windowInstancedGeoGlow2);
//bloomScene.add(skybox);
//bloomScene.add(groundMesh);
//bloomScene.add(moonLight);
//bloomScene.add(sunLight);
/*const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
const fxaaPass = new ShaderPass(FXAAShader);
const filmPass = new FilmPass(0.05, 0, 0, false);
composer.addPass(renderPass);
composer.addPass(fxaaPass);
composer.addPass(filmPass);*/
const composer = new EffectComposer(renderer);
const bloomPass = new ShaderPass(BloomShader);
const boxBlur = new ShaderPass(BoxBlurShader);
const bloomAddPass = new ShaderPass(BloomAddShader);
const fxaaPass = new ShaderPass(FXAAShader);
const defferedLighting = new ShaderPass(DefferedLighting);
const filmPass = new FilmPass(0.05, 0, 0, false);
composer.addPass(bloomPass);
composer.addPass(boxBlur);
composer.addPass(bloomAddPass);
composer.addPass(defferedLighting);
composer.addPass(fxaaPass);
composer.addPass(filmPass);
const defaultTexture = new THREE.WebGLRenderTarget(rWidth, rHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter
});
defaultTexture.depthTexture = new THREE.DepthTexture();
const bloomTexture = new THREE.WebGLRenderTarget(rWidth, rHeight, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter
});
bloomTexture.depthTexture = new THREE.DepthTexture();
const onMat = new THREE.Matrix4().makeScale(10000, 1, 10000);
const offMat = new THREE.Matrix4().makeScale(0.0001, 1, 0.0001);
const windowMat = new THREE.Matrix4();
const windowScale = new THREE.Vector3();
let lastUpdate = performance.now();
let bloomAmt = 0.5;
const lights = [
    /* { position: new THREE.Vector3(0, 10, 0), color: new THREE.Color(1, 0, 1), intensity: 1, range: 50, enabled: 1 },
      { position: new THREE.Vector3(30, 10, 30), color: new THREE.Color(0, 1, 0), intensity: 1, range: 50, enabled: 1 },
      { position: new THREE.Vector3(-30, 10, 30), color: new THREE.Color(1, 0, 0), intensity: 1, range: 50, enabled: 1 },
      { position: new THREE.Vector3(-30, 10, -30), color: new THREE.Color(0, 0, 1), intensity: 1, range: 50, enabled: 1 },
      { position: new THREE.Vector3(30, 10, -30), color: new THREE.Color(0, 1, 1), intensity: 1, range: 50, enabled: 1 }*/
]

function animate() {
    requestAnimationFrame(animate);
    const delta = performance.now() - lastUpdate;
    lastUpdate = performance.now();
    controls.update();
    material.uniforms.time.value = performance.now() * 0.001;
    material.uniforms.playerPos.value = camera.position;
    skybox.position.copy(camera.position);
    sunLight.position.x = -skyboxSize * Math.sin(material.uniforms.time.value * 0.1) * Math.cos(3.1415 / 8.0);
    sunLight.position.y = skyboxSize * Math.cos(material.uniforms.time.value * 0.1);
    sunLight.position.z = skyboxSize * Math.sin(material.uniforms.time.value * 0.1) * Math.sin(3.1415 / 8.0);
    moonLight.position.x = -skyboxSize * Math.sin(material.uniforms.time.value * 0.1 + Math.PI) * Math.cos(3.1415 / 8.0);
    moonLight.position.y = skyboxSize * Math.cos(material.uniforms.time.value * 0.1 + Math.PI);
    moonLight.position.z = skyboxSize * Math.sin(material.uniforms.time.value * 0.1 + Math.PI) * Math.sin(3.1415 / 8.0);
    const cycleWeight = (Math.atan(8.0 * Math.sin(material.uniforms.time.value * 0.1 - 3.1415926535 / 2.0)) / Math.atan(8.0) + 1.0) / 2.0;
    sunLight.intensity = 0.5 * (1 - cycleWeight ** 2);
    moonLight.intensity = 0.2 * (cycleWeight ** 2);
    if (sunLight.intensity < 0.1) {
        sunLight.castShadow = false;
    } else {
        sunLight.castShadow = true;
    }
    const frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    buildingBoxes.sort((boxA, boxB) => {
        return boxA.distanceToPoint(camera.position) - boxB.distanceToPoint(camera.position);
    });
    robots.forEach(robot => {
        robot.update(delta, frustum, buildingBoxes);
    });
    if (robotInstance) {
        robotInstance.instanceMatrix.needsUpdate = true;
        robotAmbientShadows.instanceMatrix.needsUpdate = true;
        robotAmbientShadows.instanceColor.needsUpdate = true;
    }
    buildingGlowers.forEach(glower => {
        for (let i = 0; i < glower.count; i++) {
            glower.getMatrixAt(i, windowMat);
            windowScale.setFromMatrixScale(windowMat);
            if (windowScale.x < 0.01 && glower.visible) {
                if (cycleWeight > 0.5 && Math.random() < 0.00025) {
                    windowMat.multiply(onMat);
                }
            } else if (windowScale.x > 0.9) {
                if (cycleWeight < 0.5 && Math.random() < 0.005) {
                    windowMat.multiply(offMat);
                }
            }
            glower.setMatrixAt(i, windowMat);
            windowInstancedGeoGlow2.setMatrixAt(i, windowMat)
        }
        glower.instanceMatrix.needsUpdate = true;
        windowInstancedGeoGlow2.instanceMatrix.needsUpdate = true;
    });
    smokestacks.forEach(smokestack => {
        for (let i = 0; i < 3; i++) {
            const smokeDir = smokestack.direction.clone();
            const saturation = 0.875 + Math.random() * 0.25;
            smokeEmitter.emit({
                position: new THREE.Vector3(0, -5, 0).add(smokestack.position),
                rotation: new THREE.Vector3(0.0, 0.0, Math.random() * Math.PI * 2),
                scale: new THREE.Vector3(10.0, 10.0, 10.0),
                speed: 1,
                size: 1,
                color: new THREE.Vector3(saturation, saturation, saturation).multiplyScalar(0.5),
                //colorDecay: 0.9,
                velocity: {
                    position: smokeDir.add(new THREE.Vector3(0.1 - 0.2 * Math.random(), 0.2 + 0.1 * Math.random(), 0.1 - 0.2 * Math.random())).multiplyScalar(1),
                    rotation: new THREE.Vector3(0.0, 0.0, 0.0),
                    scale: new THREE.Vector3(0.0, 0.0, 0.0),
                    speed: 0,
                    size: -0.004 + -0.004 * Math.random()
                },
                billboard: true
            });
        }
    });
    //console.time();
    smokeEmitter.update(Math.min(delta, 100), camera);
    //console.timeEnd();
    const sunset = (Math.exp(-Math.pow((cycleWeight - 0.5), 2.0)) - 0.779) * (1.0 / (1.0 - 0.779));
    sunLight.color.setRGB(1.0, 1.0 - sunset, 1.0 - sunset);
    cars.forEach(car => {
        car.update(cityData.directionMap, cityData.cityMap);
    });
    AOInstances.instanceMatrix.needsUpdate = true;
    //renderer.render(scene, camera);
    renderer.setRenderTarget(defaultTexture);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(bloomTexture);
    renderer.clear();
    renderer.render(bloomScene, camera);
    bloomPass.uniforms["sceneDiffuse"].value = defaultTexture.texture;
    bloomPass.uniforms["bloomDiffuse"].value = bloomTexture.texture;
    bloomPass.uniforms["sceneDepth"].value = defaultTexture.depthTexture;
    bloomPass.uniforms["bloomDepth"].value = bloomTexture.depthTexture;
    bloomAddPass.uniforms["sceneDiffuse"].value = defaultTexture.texture;
    bloomAddPass.uniforms["bloomAmt"].value = bloomAmt;
    defferedLighting.uniforms["tDepth"].value = defaultTexture.depthTexture;
    camera.updateMatrixWorld();
    defferedLighting.uniforms["inverseProjection"].value = camera.projectionMatrixInverse;
    defferedLighting.uniforms["inverseView"].value = camera.matrixWorld;
    defferedLighting.uniforms["cameraPos"].value = camera.position;
    defferedLighting.uniforms["size"].value = new THREE.Vector2(rWidth, rHeight);
    lights.forEach((light, i) => {
        const timeScale = Math.min((delta / 16.66), 6);
        if (!light.xVel || !light.zVel) {
            light.xVel = Math.random() * 10 - 5;
            light.zVel = Math.random() * 10 - 5;
        }
        light.xVel += (Math.random() - 0.5) * 0.125 * timeScale;
        light.zVel += (Math.random() - 0.5) * 0.125 * timeScale;
        light.position.x += light.xVel * Math.sin(performance.now() / 200) * timeScale;
        light.position.z += light.zVel * Math.cos(performance.now() / 200) * timeScale;
    })
    const lightData = new Float32Array(3 * 3 * lights.length);
    for (let i = 0; i < lights.length; i++) {
        const accessIdx = 9 * i;
        lightData[accessIdx] = lights[i].position.x;
        lightData[accessIdx + 1] = lights[i].position.y;
        lightData[accessIdx + 2] = lights[i].position.z;
        lightData[accessIdx + 3] = lights[i].color.r;
        lightData[accessIdx + 4] = lights[i].color.g;
        lightData[accessIdx + 5] = lights[i].color.b;
        lightData[accessIdx + 6] = lights[i].intensity;
        lightData[accessIdx + 7] = lights[i].range;
        lightData[accessIdx + 8] = lights[i].enabled;
    }
    const lightTexture = new THREE.DataTexture(lightData, 3, lights.length, THREE.RGBFormat);
    lightTexture.type = THREE.FloatType;
    defferedLighting.uniforms["lightTexture"].value = lightTexture;
    defferedLighting.uniforms["lightAmount"].value = lights.length;
    boxBlur.uniforms['resolution'].value = new THREE.Vector2(rWidth, rHeight);
    renderer.setRenderTarget(null);
    renderer.clear();
    composer.render();
    //console.log(renderer.info.render.calls)
    stats.update();
}
document.onkeydown = (e) => {
    if (e.key === "n") {
        bloomAmt -= 0.05;
    }
    if (e.key === "b") {
        bloomAmt += 0.05;
    }
    if (e.key === "d") {
        if (lights.length === 0) {
            for (let i = 0; i < 200; i++) {
                const randomAngle = Math.random() * Math.PI * 2;
                const randomRadius = 500 * Math.sqrt(Math.random());
                lights.push({ position: new THREE.Vector3(randomRadius * Math.sin(randomAngle), Math.random() * 50 + 1, randomRadius * Math.cos(randomAngle)), color: new THREE.Color(Math.random(), Math.random(), Math.random()), intensity: 0.5 + 0.5 * Math.random(), range: 20 + 80 * Math.random(), enabled: 1 })
            }
        } else {
            lights.length = 0;
        }
    }
    bloomAmt = Math.min(Math.max(bloomAmt, 0), 1);
}
animate();