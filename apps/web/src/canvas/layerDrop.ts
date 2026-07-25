export const resolveLayerDropTarget = (
  layerIds: ReadonlyArray<string>,
  initialIndex: number,
  index: number,
  _operationTargetId: string,
) => (initialIndex === index ? null : (layerIds[index] ?? null));
