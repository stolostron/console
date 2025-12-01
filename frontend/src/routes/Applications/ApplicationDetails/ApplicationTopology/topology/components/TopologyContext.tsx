import { createContext } from 'react'
import { action, makeObservable, observable } from 'mobx'

export class TopologyModel {
  protected creationCountsP: { numNodes: number; numEdges: number; numGroups: number; nestedLevel: number } = {
    numNodes: 6,
    numEdges: 2,
    numGroups: 1,
    nestedLevel: 0,
  }
  protected layoutP: string = 'ColaNoForce'
  protected medScaleP: number = 0.5
  protected lowScaleP: number = 0.3

  constructor() {
    makeObservable<
      TopologyModel,
      | 'nodeOptionsP'
      | 'edgeOptionsP'
      | 'creationCountsP'
      | 'layoutP'
      | 'medScaleP'
      | 'lowScaleP'
      | 'setNodeOptions'
      | 'setEdgeOptions'
      | 'setCreationCounts'
      | 'setLayout'
      | 'setMedScale'
      | 'setLowScale'
    >(this, {
      nodeOptionsP: observable.ref,
      edgeOptionsP: observable.shallow,
      creationCountsP: observable.shallow,
      layoutP: observable,
      medScaleP: observable,
      lowScaleP: observable,
      setNodeOptions: action,
      setEdgeOptions: action,
      setCreationCounts: action,
      setLayout: action,
      setMedScale: action,
      setLowScale: action,
    })
  }

  public get creationCounts(): { numNodes: number; numEdges: number; numGroups: number; nestedLevel: number } {
    return this.creationCountsP
  }

  public setCreationCounts = (counts: {
    numNodes: number
    numEdges: number
    numGroups: number
    nestedLevel: number
  }): void => {
    this.creationCountsP = counts
  }

  public get layout(): string {
    return this.layoutP
  }
  public setLayout = (newLayout: string): void => {
    this.layoutP = newLayout
  }

  public get medScale(): number {
    return this.medScaleP
  }
  public setMedScale = (scale: number): void => {
    this.medScaleP = scale
  }

  public get lowScale(): number {
    return this.lowScaleP
  }
  public setLowScale = (scale: number): void => {
    this.lowScaleP = scale
  }
}

export const TopologyContext = createContext<TopologyModel>(new TopologyModel())
