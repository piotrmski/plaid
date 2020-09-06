export interface DateRange {
  start: Date;
  /**
   * Date range end, inclusively. If end = 2010-01-10, then it refers to up to 2010-01-10 23:59:59.999.
   */
  end: Date;
}
