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
    { name: 'Jump', url: './assets/models/fbx/jump.fbx' },
    { name: 'Attack', url: './assets/models/fbx/attack.fbx' }
];

const timer = new THREE.Timer();
timer.connect(document);

init();

function init() {
    const container = document.getElementById('canvas-container');

    // 1. Configuración de Cámara (Ángulo RPG)
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(80, 120, 220); // Un poco más cerca para sentir la atmósfera

    // 2. Escena Estilo "Firelink" (Todo con colores base)
    scene = new THREE.Scene();
    
    // Color de fondo: Un gris/verde musgo muy, muy oscuro y desaturado
    const atmosphereColor = new THREE.Color(0x111613); 
    scene.background = atmosphereColor;
    
    // Niebla: Usamos FogExp2 (Exponencial) para un difuminado mucho más realista y tétrico
    scene.fog = new THREE.FogExp2(atmosphereColor, 0.0015);

    // 3. Sistema de Iluminación Dual (El secreto de la atmósfera)
    
    // Luz Hemisférica: Simula la luz de la luna filtrándose entre árboles/ruinas invisibles
    // Arriba: Azul pálido frío. Abajo: Negro/Verde oscuro.
    const hemiLight = new THREE.HemisphereLight(0x445566, 0x050a05, 0.6);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    // Luz Direccional Principal (Luz de luna dura para las sombras)
    const dirLight = new THREE.DirectionalLight(0x556677, 1.0);
    dirLight.position.set(-100, 200, -100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 150;
    dirLight.shadow.camera.bottom = -150;
    dirLight.shadow.camera.left = -150;
    dirLight.shadow.camera.right = 150;
    dirLight.shadow.bias = -0.001; // Evita artefactos visuales en el modelo
    scene.add(dirLight);

    // NUEVO: Luz de Hoguera (Puntual, cálida y cercana al suelo)
    // Esto baña un lado del caballero de color naranja brasa
    const bonfireLight = new THREE.PointLight(0xe86424, 20000, 400);
    bonfireLight.position.set(50, 30, 50); // Posicionada a la derecha y adelante
    scene.add(bonfireLight);

    // 4. Suelo Procedural (Piedra Musgosa)
    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2000, 2000), 
        // Usamos StandardMaterial para que reaccione mejor a la luz puntual de la "hoguera"
        new THREE.MeshStandardMaterial({ 
            color: 0x1f2620, // Gris piedra con un ligero toque verde oscuro
            roughness: 0.9,  // Muy rugoso, nada brillante
            metalness: 0.1,
            depthWrite: false 
        })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Cuadrícula táctica en negro con mucha transparencia para que parezcan marcas de baldosas oscuras
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
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Sombras más suaves y realistas
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 80, 0); // Mirar un poco más al pecho del personaje
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // No dejar que la cámara baje del suelo
    controls.maxDistance = 500; // No dejar que la cámara se aleje más allá de la niebla
    controls.update();

    stats = new Stats();
    // container.appendChild(stats.dom); // Descomenta si quieres ver los FPS

    window.addEventListener('resize', onWindowResize);
    
    // 6. Cargar Todo
    loadCharacterAndAnimations();
}

function loadCharacterAndAnimations() {
    const loader = new FBXLoader(manager);

    loader.load('./assets/models/fbx/Character.fbx', function (object) {
        character = object;
        mixer = new THREE.AnimationMixer(character);

        character.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Reducir el brillo a cero para que parezca metal/cuero gastado antiguo
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
    document.addEventListener('keydown', (event) => {
        if (!activeAction) return;

        switch(event.code) {
            case 'KeyW': fadeToAction('Run', 0.2); break;
            case 'KeyS': fadeToAction('Dodge', 0.2); break;
            case 'KeyA': 
            case 'KeyD': fadeToAction('Turn', 0.2); break;
            case 'Space': fadeToAction('Jump', 0.2); break;
            case 'KeyE': fadeToAction('Attack', 0.1); break;
            case 'KeyX': fadeToAction('Idle', 0.3); break;
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