import * as THREE from 'three';

/**
 * RaycastUI - 3D click/hover system for voxel UI elements.
 * Converts mouse/touch events into 3D object interactions.
 */
export class RaycastUI {
  constructor(camera, scene, canvas) {
    this.camera = camera;
    this.scene = scene;
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredObject = null;
    this.clickableObjects = [];
    this._disposed = false;

    // Store original scales for hover reset
    this._originalScales = new Map();

    // Bind methods
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);

    this.canvas.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('click', this._onClick);
    this.canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
  }

  /**
   * Register a 3D object (or group) as clickable.
   * The callback fires on click/tap.
   */
  addClickable(object, callback, opts = {}) {
    const { hoverScale = 1.08, hoverGlow = true } = opts;
    object.userData.clickable = true;
    object.userData.onClick = callback;
    object.userData.hoverScale = hoverScale;
    object.userData.hoverGlow = hoverGlow;
    this._originalScales.set(object.uuid, object.scale.clone());
    this.clickableObjects.push(object);
  }

  /**
   * Remove a clickable object.
   */
  removeClickable(object) {
    this.clickableObjects = this.clickableObjects.filter(o => o !== object);
    this._originalScales.delete(object.uuid);
    if (this.hoveredObject === object) {
      this.hoveredObject = null;
    }
  }

  /**
   * Clear all clickable objects.
   */
  clearAll() {
    if (this.hoveredObject) {
      this._unhover(this.hoveredObject);
    }
    this.clickableObjects = [];
    this._originalScales.clear();
    this.hoveredObject = null;
  }

  _getIntersects(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Get all descendant meshes from clickable groups
    const allDescendants = [];
    this.clickableObjects.forEach(obj => {
      obj.traverse(child => {
        if (child.isMesh || child.isSprite) {
          allDescendants.push(child);
        }
      });
    });

    return this.raycaster.intersectObjects(allDescendants, false);
  }

  _findClickableParent(obj) {
    let current = obj;
    while (current) {
      if (current.userData && current.userData.clickable) return current;
      current = current.parent;
    }
    return null;
  }

  _hover(obj) {
    const hs = obj.userData.hoverScale || 1.08;
    const orig = this._originalScales.get(obj.uuid);
    if (orig) {
      obj.scale.set(orig.x * hs, orig.y * hs, orig.z * hs);
    }
    this.canvas.style.cursor = 'pointer';
  }

  _unhover(obj) {
    const orig = this._originalScales.get(obj.uuid);
    if (orig) {
      obj.scale.copy(orig);
    }
  }

  _onMouseMove(event) {
    if (this._disposed) return;
    const intersects = this._getIntersects(event.clientX, event.clientY);

    // Unhover previous
    if (this.hoveredObject) {
      this._unhover(this.hoveredObject);
      this.hoveredObject = null;
      this.canvas.style.cursor = 'default';
    }

    if (intersects.length > 0) {
      const target = this._findClickableParent(intersects[0].object);
      if (target) {
        this.hoveredObject = target;
        this._hover(target);
      }
    }
  }

  _onClick(event) {
    if (this._disposed) return;
    const intersects = this._getIntersects(event.clientX, event.clientY);

    if (intersects.length > 0) {
      const target = this._findClickableParent(intersects[0].object);
      if (target && target.userData.onClick) {
        console.log('3D Click detected:', target.name || 'unnamed object');
        target.userData.onClick();
      } else {
        console.log('Click on non-clickable 3D object:', intersects[0].object);
      }
    } else {
      console.log('No 3D objects intersected at click position');
    }
  }

  _onTouchStart(event) {
    if (this._disposed) return;
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const intersects = this._getIntersects(touch.clientX, touch.clientY);
      if (intersects.length > 0) {
        const target = this._findClickableParent(intersects[0].object);
        if (target) {
          this._touchTarget = target;
          this._hover(target);
        }
      }
    }
  }

  _onTouchEnd(event) {
    if (this._disposed) return;
    if (this._touchTarget) {
      const target = this._touchTarget;
      this._unhover(target);
      if (target.userData.onClick) {
        target.userData.onClick();
      }
      this._touchTarget = null;
    }
  }

  dispose() {
    this._disposed = true;
    if (this.hoveredObject) {
      this._unhover(this.hoveredObject);
    }
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('touchstart', this._onTouchStart);
    this.canvas.removeEventListener('touchend', this._onTouchEnd);
    this.clickableObjects = [];
    this._originalScales.clear();
    this.hoveredObject = null;
    this.canvas.style.cursor = 'default';
  }
}
