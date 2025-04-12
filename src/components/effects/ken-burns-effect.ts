import { useCurrentFrame } from "remotion";

/**
 * Direction options for Ken Burns effect
 */
export type KenBurnsDirection =
  | "center"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/**
 * Ken Burns effect configuration
 */
export interface KenBurnsConfig {
  /**
   * Whether the effect is enabled
   */
  enabled: boolean;

  /**
   * Type of zoom: "in" zooms from normal to zoomed, "out" zooms from zoomed to normal
   */
  zoomType: "in" | "out" | "none";

  /**
   * Direction to focus the zoom effect
   */
  direction: KenBurnsDirection;

  /**
   * Speed of the effect: slow or moderate
   */
  speed: "slow" | "moderate";
}

/**
 * Default Ken Burns configuration
 */
export const DEFAULT_KEN_BURNS_CONFIG: KenBurnsConfig = {
  enabled: false,
  zoomType: "none",
  direction: "center",
  speed: "moderate"
};

/**
 * Calculate the transform style for Ken Burns effect
 *
 * @param frame Current frame number
 * @param durationInFrames Total duration in frames
 * @param config Ken Burns effect configuration
 * @returns CSS transform style string
 */
export const getKenBurnsTransform = (
  frame: number,
  durationInFrames: number,
  config: KenBurnsConfig
): string => {
  // If no effect is selected, return no transform
  if (config.zoomType === "none" || !config.enabled) {
    return "scale(1)";
  }

  // Calculate progress (0 to 1)
  const progress = frame / durationInFrames;

  // Define zoom levels based on zoom type
  const startScale = config.zoomType === "in" ? 1 : 1.3;
  const endScale = config.zoomType === "in" ? 1.3 : 1;

  // Calculate current scale based on progress
  const scale = startScale + (endScale - startScale) * progress;

  // Define speed multipliers
  const speedMultiplier =
    config.speed === "slow" ? 0.5 :
    1; // moderate is default

  // Calculate translation values based on direction
  let translateX = 0;
  let translateY = 0;

  // Maximum translation as percentage
  const maxTranslation = 5 * speedMultiplier;

  // Calculate translation based on direction
  // For "in" we move toward the direction, for "out" we move away from the direction
  if (config.direction.includes("left")) {
    translateX = config.zoomType === "in" ? maxTranslation * progress : maxTranslation * (1 - progress);
  } else if (config.direction.includes("right")) {
    translateX = config.zoomType === "in" ? -maxTranslation * progress : -maxTranslation * (1 - progress);
  }

  if (config.direction.includes("top")) {
    translateY = config.zoomType === "in" ? maxTranslation * progress : maxTranslation * (1 - progress);
  } else if (config.direction.includes("bottom")) {
    translateY = config.zoomType === "in" ? -maxTranslation * progress : -maxTranslation * (1 - progress);
  }

  // Combine scale and translation into a transform string
  return `scale(${scale}) translate(${translateX}%, ${translateY}%)`;
};

/**
 * Hook to apply Ken Burns effect to a media element
 *
 * @param durationInFrames Total duration in frames
 * @param config Ken Burns effect configuration
 * @returns CSS transform style to apply to the element
 */
export const useKenBurnsEffect = (
  durationInFrames: number,
  config: KenBurnsConfig = DEFAULT_KEN_BURNS_CONFIG
): { transform: string } => {
  const frame = useCurrentFrame();

  const transform = getKenBurnsTransform(frame, durationInFrames, config);

  return { transform };
};

/**
 * Automated Ken Burns effect generator
 * Implements the logic for creating a sequence of Ken Burns effects
 * based on the provided algorithm
 */
export class KenBurnsAutomation {
  private history: Array<{action: "in" | "out", focus: KenBurnsDirection}> = [];
  private focusPoints: KenBurnsDirection[] = [
    "center",
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top",
    "bottom",
    "left",
    "right"
  ];

  /**
   * Generate the next Ken Burns move
   * @returns Ken Burns configuration for the next move
   */
  generateNextMove(): KenBurnsConfig {
    // If history is empty, start with a random move
    if (this.history.length === 0) {
      const action = Math.random() > 0.5 ? "in" : "out";
      const focus = this.getRandomFocusPoint();

      this.history.push({ action, focus });

      return {
        enabled: true,
        zoomType: action,
        direction: focus,
        speed: "moderate"
      };
    }

    // Get the last move
    const lastMove = this.history[this.history.length - 1];

    // Choose action (zoom in or out)
    let newAction: "in" | "out";

    // Default: alternate from last action
    newAction = lastMove.action === "in" ? "out" : "in";

    // Introduce variation: 25% chance to repeat the same action
    if (Math.random() < 0.25) {
      newAction = lastMove.action;
    }

    // Choose focus point
    let newFocus: KenBurnsDirection;

    // 25% chance to re-use a focus point from history
    if (Math.random() < 0.25 && this.history.length > 1) {
      // Pick a random move from history
      const historyIndex = Math.floor(Math.random() * this.history.length);
      newFocus = this.history[historyIndex].focus;

      // If re-using the immediately preceding focus point,
      // 70% chance to reverse the action for a back-and-forth effect
      if (newFocus === lastMove.focus && Math.random() < 0.7) {
        newAction = lastMove.action === "in" ? "out" : "in";
      }
    } else {
      // Get a new focus point that's different from the last one
      const recentFocusPoints = this.history
        .slice(Math.max(0, this.history.length - 3))
        .map(move => move.focus);

      newFocus = this.getRandomFocusPoint(recentFocusPoints);
    }

    // Choose speed - only slow or moderate
    let speed: "slow" | "moderate";
    const speedRandom = Math.random();
    if (speedRandom < 0.4) {
      speed = "slow";
    } else {
      speed = "moderate";
    }

    // Add to history
    this.history.push({ action: newAction, focus: newFocus });

    // If history gets too long, trim it
    if (this.history.length > 10) {
      this.history = this.history.slice(-10);
    }

    return {
      enabled: true,
      zoomType: newAction,
      direction: newFocus,
      speed
    };
  }

  /**
   * Get a random focus point, optionally excluding certain points
   */
  private getRandomFocusPoint(exclude: KenBurnsDirection[] = []): KenBurnsDirection {
    const availablePoints = this.focusPoints.filter(point => !exclude.includes(point));

    // If all points are excluded, just return a completely random one
    if (availablePoints.length === 0) {
      const randomIndex = Math.floor(Math.random() * this.focusPoints.length);
      return this.focusPoints[randomIndex];
    }

    const randomIndex = Math.floor(Math.random() * availablePoints.length);
    return availablePoints[randomIndex];
  }

  /**
   * Apply Ken Burns effect to all scenes
   * @param scenes Array of scenes to apply the effect to
   * @returns Updated scenes with Ken Burns effect applied
   */
  applyToAllScenes(scenes: any[]): any[] {
    // Reset history to ensure a fresh sequence
    this.history = [];

    // Apply a unique Ken Burns effect to each scene
    return scenes.map(scene => {
      const kenBurnsConfig = this.generateNextMove();

      // Create a new scene object with the Ken Burns effect applied
      return {
        ...scene,
        kenBurns: kenBurnsConfig
      };
    });
  }
}
