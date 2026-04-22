import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const manager = new THREE.LoadingManager();
let camera, scene, renderer, stats, character;
let mixer;

// Diccionario de acciones y estado
const actions = {};
let activeAction, previousAction;

// IMPORTANTE: Asegúrate de que estos nombres de archivo coincidan con los tuyos
const animFiles = [
    { name: 'Idle', url: './assets/models/fbx/idle.fbx' },
    { name: 'Turn', url: './assets/models/fbx/drunk.fbx' },
    { name: 'Dodge', url: './assets/models/fbx/dodge.fbx' },
    { name: 'Run', url: './assets/models/fbx/run.fbx' },
    { name: 'Jump', url: './assets/models/fbx/jump.fbx' }, // Tu Jump Up
    { name: 'Attack', url: './assets/models/fbx/attack.fbx' }
];

const timer = new THREE.Timer();
timer.connect(document);

init();

function init() {
    const container = document.getElementById('canvas-container');

    // 1. Configuración de Cámara y Escena
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); 
    scene.fog = new THREE.Fog(0x1a1a1a, 200, 1000);

    // 2. Luces
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    // 3. Suelo y Cuadrícula (El "área")
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000), 
        new THREE.MeshPhongMaterial({ color: 0x222222, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // 4. Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    stats = new Stats();
    container.appendChild(stats.dom);

    window.addEventListener('resize', onWindowResize);
    
    // 5. Cargar Todo
    loadCharacterAndAnimations();
}

function loadCharacterAndAnimations() {
    const loader = new FBXLoader(manager);

    // Cargar Modelo Base
    loader.load('./assets/models/fbx/Character.fbx', function (object) {
        character = object;
        mixer = new THREE.AnimationMixer(character);

        character.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(character);

        // Cargar Animaciones iterativamente
        animFiles.forEach(anim => {
            loader.load(anim.url, function (animObject) {
                const clip = animObject.animations[0];
                const action = mixer.clipAction(clip);
                
                // Todas las animaciones se repetirán en bucle por defecto
                actions[anim.name] = action;

                // Reproducir Idle al inicio
                if (anim.name === 'Idle') {
                    fadeToAction('Idle', 0.5);
                }
            });
        });

        setupKeyControls();
    });
}

// Función maestra de transición
function fadeToAction(name, duration) {
    // Si ya estamos en esta animación, no hagas nada
    if (activeAction === actions[name]) return;

    previousAction = activeAction;
    activeAction = actions[name];

    if (previousAction) {
        previousAction.fadeOut(duration);
    }

    if (activeAction) {
        activeAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play();
    }
}

// Nueva Lógica: Selector de Estados por toque
function setupKeyControls() {
    document.addEventListener('keydown', (event) => {
        if (!activeAction) return;

        switch(event.code) {
            case 'KeyW':
                fadeToAction('Run', 0.2);
                break;
            case 'KeyS':
                fadeToAction('Dodge', 0.2);
                break;
            case 'KeyA':
            case 'KeyD':
                fadeToAction('Turn', 0.2);
                break;
            case 'Space':
                fadeToAction('Jump', 0.2);
                break;
            case 'KeyE':
                fadeToAction('Attack', 0.2);
                break;
            case 'KeyX': // Tecla de freno
                fadeToAction('Idle', 0.3);
                break;
        }
    });
}

function onWindowResize() {
    const container = document.getElementById('canvas-container');
    camera.aspect = window.innerWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, container.clientHeight);
}

function animate() {
    timer.update();
    const delta = timer.getDelta();
    
    if (mixer) mixer.update(delta);
    
    renderer.render(scene, camera);
    stats.update();
}