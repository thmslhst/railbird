/**
 * Camera Rail system for Railbird.
 * Manages control points that define the camera path.
 * The rail maps t ∈ [0, 1] → camera pose (position + rotation).
 */

import * as THREE from "three";

export interface ControlPoint {
  id: string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export interface ControlPointData {
  id: string;
  position: { x: number; y: number; z: number };
  quaternion: { x: number; y: number; z: number; w: number };
}

export interface CameraPose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

export interface CameraRailSystem {
  controlPoints: ControlPoint[];

  // Control point management
  addPoint: (position: THREE.Vector3, quaternion?: THREE.Quaternion) => ControlPoint;
  removePoint: (id: string) => void;
  updatePoint: (id: string, position?: THREE.Vector3, quaternion?: THREE.Quaternion) => void;
  getPoint: (id: string) => ControlPoint | undefined;
  reorderPoint: (id: string, newIndex: number) => void;

  // Rail interpolation
  getPose: (t: number) => CameraPose | null;

  // Serialization
  toJSON: () => ControlPointData[];
  fromJSON: (data: ControlPointData[]) => void;

  // Cleanup
  dispose: () => void;
}

let pointCounter = 0;

function generatePointId(): string {
  return `cp_${Date.now()}_${pointCounter++}`;
}

export function createCameraRailSystem(): CameraRailSystem {
  const controlPoints: ControlPoint[] = [];

  function addPoint(
    position: THREE.Vector3,
    quaternion?: THREE.Quaternion
  ): ControlPoint {
    const point: ControlPoint = {
      id: generatePointId(),
      position: position.clone(),
      quaternion: quaternion?.clone() ?? new THREE.Quaternion(),
    };
    controlPoints.push(point);
    return point;
  }

  function removePoint(id: string): void {
    const index = controlPoints.findIndex((p) => p.id === id);
    if (index !== -1) {
      controlPoints.splice(index, 1);
    }
  }

  function updatePoint(
    id: string,
    position?: THREE.Vector3,
    quaternion?: THREE.Quaternion
  ): void {
    const point = controlPoints.find((p) => p.id === id);
    if (point) {
      if (position) {
        point.position.copy(position);
      }
      if (quaternion) {
        point.quaternion.copy(quaternion);
      }
    }
  }

  function getPoint(id: string): ControlPoint | undefined {
    return controlPoints.find((p) => p.id === id);
  }

  function reorderPoint(id: string, newIndex: number): void {
    const currentIndex = controlPoints.findIndex((p) => p.id === id);
    if (currentIndex === -1) return;

    const [point] = controlPoints.splice(currentIndex, 1);
    const clampedIndex = Math.max(0, Math.min(newIndex, controlPoints.length));
    controlPoints.splice(clampedIndex, 0, point);
  }

  function getPose(t: number): CameraPose | null {
    if (controlPoints.length === 0) return null;
    if (controlPoints.length === 1) {
      return {
        position: controlPoints[0].position.clone(),
        quaternion: controlPoints[0].quaternion.clone(),
      };
    }

    // Clamp t to [0, 1]
    const clampedT = Math.max(0, Math.min(1, t));

    // Linear interpolation between control points for now
    // Future: Catmull-Rom spline interpolation
    const totalSegments = controlPoints.length - 1;
    const segmentT = clampedT * totalSegments;
    const segmentIndex = Math.min(Math.floor(segmentT), totalSegments - 1);
    const localT = segmentT - segmentIndex;

    const p0 = controlPoints[segmentIndex];
    const p1 = controlPoints[segmentIndex + 1];

    const position = new THREE.Vector3().lerpVectors(
      p0.position,
      p1.position,
      localT
    );
    const quaternion = new THREE.Quaternion().slerpQuaternions(
      p0.quaternion,
      p1.quaternion,
      localT
    );

    return { position, quaternion };
  }

  function toJSON(): ControlPointData[] {
    return controlPoints.map((p) => ({
      id: p.id,
      position: { x: p.position.x, y: p.position.y, z: p.position.z },
      quaternion: {
        x: p.quaternion.x,
        y: p.quaternion.y,
        z: p.quaternion.z,
        w: p.quaternion.w,
      },
    }));
  }

  function fromJSON(data: ControlPointData[]): void {
    controlPoints.length = 0;
    for (const d of data) {
      controlPoints.push({
        id: d.id,
        position: new THREE.Vector3(d.position.x, d.position.y, d.position.z),
        quaternion: new THREE.Quaternion(
          d.quaternion.x,
          d.quaternion.y,
          d.quaternion.z,
          d.quaternion.w
        ),
      });
    }
  }

  function dispose(): void {
    controlPoints.length = 0;
  }

  return {
    controlPoints,
    addPoint,
    removePoint,
    updatePoint,
    getPoint,
    reorderPoint,
    getPose,
    toJSON,
    fromJSON,
    dispose,
  };
}
