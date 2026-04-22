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

// IMPORTANTE: Para GitHub Pages, asegúrate de que mayúsculas y minúsculas
// coincidan EXACTAMENTE con los archivos de tu carpeta fbx.
const animFiles = [
    { name: 'Idle', url: './assets/models/fbx/idle.fbx' },
    { name: 'Turn', url: './assets/models/fbx/Drunk.fbx' },
    { name: 'Dodge', url: './assets/models/fbx/dodge.fbx' },
    { name: 'Run', url: './assets/models/fbx/run.fbx' },
    { name: 'Jump', url: './assets/models/fbx/jump.fbx' },
    { name: 'Attack', url: './assets/models/fbx/attack.fbx' }
];

const timer = new THREE.Timer();
timer.connect(document);

init();

function init() {
    const container = document.getElementById('canvas-container');

    // 1. Configuración de Cámara (Ángulo RPG cinemático)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(80, 120, 220); 

    // 2. Escena Estilo "Firelink"
    scene = new THREE.Scene();
    
    // Color de fondo: Verde musgo/gris muy oscuro
    const atmosphereColor = new THREE.Color(0x111613); 
    scene.background = atmosphereColor;
    
    // Niebla Exponencial: Ligera pero profunda para difuminar el horizonte
    scene.fog = new THREE.FogExp2(atmosphereColor, 0.0015);

    // 3. Sistema de Iluminación Dual
    // Luz Hemisférica: Simula luz de luna fría filtrándose desde el cielo oscuro
    const hemiLight = new THREE.HemisphereLight(0x445566, 0x050a05, 0.6);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // Luz Direccional Principal (Luz de luna dura para proyectar sombras)
    const dirLight = new THREE.DirectionalLight(0x778899, 1.5);
    dirLight.position.set(-100, 200, -100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.bias = -0.001; // Evita artefactos visuales en el modelo
    scene.add(dirLight);

    // Luz de Hoguera (Puntual, cálida, de alta intensidad)
    const bonfireLight = new THREE.PointLight(0xe86424, 50000, 800);
    bonfireLight.position.set(50, 30, 50); 
    scene.add(bonfireLight);

    // 4. Suelo Procedural (Piedra Musgosa)
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000), 
        // StandardMaterial reacciona excelente a la luz puntual de la hoguera
        new THREE.MeshStandardMaterial({ 
            color: 0x2a3b2b, // Piedra con un notorio tinte verdoso oscuro
            roughness: 0.9,  // Rugoso para emular piedra
            metalness: 0.1,
            depthWrite: false 
        })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Cuadrícula táctica en negro con mucha transparencia
    const grid = new THREE.GridHelper(2000, 50, 0x000000, 0x000000);
    grid.material.opacity = 0.15;
    grid.material.transparent = true;
    grid.position.y = 0.5; // Elevar ligeramente para evitar z-fighting con el suelo
    scene.add(grid);

    // 5. Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap; // Sintaxis actualizada sin advertencias
    container.appendChild(renderer.domElement);

    // Controles orbitales
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 80, 0); 
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // No permite ver debajo del suelo
    controls.maxDistance = 500; // Mantiene la cámara dentro de la niebla visible
    controls.update();

    stats = new Stats();
    // container.appendChild(stats.dom); // Descomenta para ver los FPS

    window.addEventListener('resize', onWindowResize);
    
    // 6. Cargar Modelo y Animaciones
    loadCharacterAndAnimations();
}

function loadCharacterAndAnimations() {
    const loader = new FBXLoader(manager);

    // IMPORTANTE: Asegúrate de que el nombre del archivo base coincide
    loader.load('./assets/models/fbx/Character.fbx', function (object) {
        character = object;
        mixer = new THREE.AnimationMixer(character);

        character.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Reducir el brillo a cero para aspecto de metal/cuero gastado
                if(child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.shininess = 0);
                    } else {
                        child.material.shininess = 0;
                    }
                }
            }
        });
        scene.add(character);

        animFiles.forEach(anim => {
            loader.load(anim.url, function (animObject) {
                const clip = animObject.animations[0];
                const action = mixer.clipAction(clip);
                
                actions[anim.name] = action;

                if (anim.name === 'Idle') {
                    fadeToAction('Idle', 0.5);
                }
            });
        });

        setupKeyControls();
    });
}

function fadeToAction(name, duration) {
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

function setupKeyControls() {
    // Tiempos de crossfade hiper rápidos (0.05s y 0.02s) para sensación táctica instantánea
    document.addEventListener('keydown', (event) => {
        if (!activeAction) return;

        switch(event.code) {
            case 'KeyW': fadeToAction('Run', 0.05); break;
            case 'KeyS': fadeToAction('Dodge', 0.05); break;
            case 'KeyA': 
            case 'KeyD': fadeToAction('Turn', 0.05); break;
            case 'Space': fadeToAction('Jump', 0.02); break;
            case 'KeyE': fadeToAction('Attack', 0.02); break;
            case 'KeyX': fadeToAction('Idle', 0.2); break; // Transición suave al descanso
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
    if(stats) stats.update();
}