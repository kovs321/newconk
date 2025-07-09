import {
  CustomSeriesView,
  PaneRendererCustomData,
  WhitespaceData,
  Time,
} from 'lightweight-charts';

export interface HeatMapData {
  time: Time;
  value: number;
  amount: number;
}

export interface HeatMapSeriesOptions {
  cellShader: (amount: number) => string;
  cellBorderColor?: string;
  cellWidth?: number;
  cellHeight?: number;
}

export class HeatMapSeriesRenderer {
  private _data: PaneRendererCustomData<Time> | null = null;
  private _options: HeatMapSeriesOptions | null = null;

  draw(
    target: CanvasRenderingContext2D,
    priceConverter: (price: number) => number,
    timeConverter: (time: Time) => number,
    size: { width: number; height: number }
  ): void {
    if (!this._data || !this._options) return;

    const { cellWidth = 20, cellHeight = 10, cellShader, cellBorderColor } = this._options;

    target.save();

    this._data.data.forEach((item) => {
      const heatMapItem = item as HeatMapData;
      const x = timeConverter(heatMapItem.time);
      const y = priceConverter(heatMapItem.value);

      // Draw cell background
      target.fillStyle = cellShader(heatMapItem.amount);
      target.fillRect(x - cellWidth / 2, y - cellHeight / 2, cellWidth, cellHeight);

      // Draw cell border if specified
      if (cellBorderColor) {
        target.strokeStyle = cellBorderColor;
        target.lineWidth = 1;
        target.strokeRect(x - cellWidth / 2, y - cellHeight / 2, cellWidth, cellHeight);
      }
    });

    target.restore();
  }

  update(data: PaneRendererCustomData<Time>, options: HeatMapSeriesOptions): void {
    this._data = data;
    this._options = options;
  }
}

export class HeatMapSeries implements CustomSeriesView<Time> {
  private _renderer: HeatMapSeriesRenderer;

  constructor() {
    this._renderer = new HeatMapSeriesRenderer();
  }

  priceValueBuilder(plotRow: HeatMapData): number {
    return plotRow.value;
  }

  isWhitespace(data: HeatMapData | WhitespaceData): data is WhitespaceData {
    return (data as HeatMapData).value === undefined;
  }

  renderer(): HeatMapSeriesRenderer {
    return this._renderer;
  }

  update(
    data: PaneRendererCustomData<Time>,
    options: HeatMapSeriesOptions
  ): void {
    this._renderer.update(data, options);
  }

  defaultOptions(): HeatMapSeriesOptions {
    return {
      cellShader: (amount: number) => `hsl(${240 - amount * 2.4}, 100%, 50%)`,
      cellBorderColor: undefined,
      cellWidth: 20,
      cellHeight: 10,
    };
  }
}