# 🗡️ El Vigía Errante: Visor de Movimientos Tácticos

![Three.js](https://img.shields.io/badge/threejs-black?style=for-the-badge&logo=three.js&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)

Una aplicación web interactiva en 3D que visualiza las animaciones tácticas de un caballero en un entorno de fantasía oscura generado proceduralmente. Diseñado con un enfoque cinemático y controles orientados a eventos, simulando un visor de estado de combate con una atmósfera lúgubre e inmersiva.

## ✨ Características Técnicas

- **Motor 3D:** Renderizado en tiempo real utilizando [Three.js](https://threejs.org/).
- **Máquina de Estados de Animación:** Transiciones suaves (Crossfading) entre animaciones FBX independientes utilizando `AnimationMixer` y eventos de teclado únicos.
- **Entorno Procedural:** Estética *Dark Fantasy* lograda sin texturas externas, utilizando matemáticas puras y físicas de luz:
  - Iluminación dual (HemiLight para luz de entorno fría y PointLight para el resplandor cálido de la hoguera).
  - Materiales absorbentes (`shininess: 0`) para emular piedra musgosa y armadura gastada.
  - `FogExp2` para una niebla volumétrica y tétrica que oculta los límites del mapa.
- **HUD Cinemático:** Interfaz de usuario construida con degradados oscuros asimétricos, tipografía clásica y diseño responsivo flotante, garantizando que el canvas 3D mantenga el protagonismo.

## ⚔️ Comandos de Combate

El visor utiliza un selector de estados por toque (no es necesario mantener presionada la tecla para mantener la acción).

| Tecla | Acción de Combate |
| :---: | :--- |
| <kbd>W</kbd> | **Avanzar** |
| <kbd>S</kbd> | **Evasión** |
| <kbd>ESPACIO</kbd> | **Salto Vertical** |
| <kbd>E</kbd> | **Ofensiva** |
| <kbd>A</kbd> | **Ebrio** |
| <kbd>X</kbd> | **Descanso** (Cancelar / Reposo) |

## 📁 Estructura del Proyecto

Para la correcta ejecución del visor, la arquitectura de directorios debe mantenerse de la siguiente manera:

```text
El-Vigia-Errante/
├── index.html
├── README.md
└── assets/
    ├── css/
    │   └── main.css
    ├── js/
    │   └── main.js
    ├── build/
    │   └── three.module.js
    ├── jsm/          <-- (Addons de Three.js: OrbitControls, FBXLoader, etc.)
    └── models/
        └── fbx/
            ├── Character.fbx   <-- Modelo principal con Skin
            ├── idle.fbx        <-- Animaciones sin Skin
            ├── run.fbx
            ├── dodge.fbx
            ├── jump.fbx
            ├── attack.fbx
            └── drunk.fbx

🚀 Ejecución Local
Por políticas de seguridad de los navegadores (CORS), los modelos .fbx requieren un servidor local para ser cargados correctamente.

Opción 1: Visual Studio Code (Recomendada)

Instala la extensión Live Server.

Abre la carpeta del proyecto en VS Code.

Haz clic derecho sobre index.html y selecciona "Open with Live Server".

Opción 2: Python (Terminal)

Abre tu terminal de comandos en la carpeta raíz del proyecto.

Ejecuta: python -m http.server 8000

Abre tu navegador web e ingresa a http://localhost:8000

🛡️ Créditos
Ingeniería y Desarrollo: Leonardo Gutiérrez | Ingeniería en Sistemas Computacionales

Motor Gráfico: Three.js

Motor de Animación: Mixamo

Tipografía: Google Fonts (Cinzel, Inter)