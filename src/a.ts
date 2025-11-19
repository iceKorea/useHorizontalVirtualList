import {
  useEventListener,
  useLatest,
  useMemoizedFn,
  useSize,
  useUpdateEffect,
} from "ahooks";
import { BasicTarget, getTargetElement } from "ahooks/lib/utils/domTarget";
import { useEffect, useMemo, useState, useRef } from "react";
import type { CSSProperties } from "react";

export const isNumber = (value: unknown): value is number =>
  typeof value === "number";

type ItemWidth<T> = (index: number, data: T) => number;

export interface Options<T> {
  containerTarget: BasicTarget;
  wrapperTarget: BasicTarget;
  itemWidth: number | ItemWidth<T>;
  overscan?: number;
}

const useVirtualList = <T = any>(list: T[], options: Options<T>) => {
  const { containerTarget, wrapperTarget, itemWidth, overscan = 5 } = options;

  const itemWidthRef = useLatest(itemWidth);

  const size = useSize(containerTarget);

  const scrollTriggerByScrollToFunc = useRef(false);

  const [targetList, setTargetList] = useState<{ index: number; data: T }[]>(
    []
  );

  const [wrapperStyle, setWrapperStyle] = useState<CSSProperties>({});

  // 获取可见区域能容纳多少个元素
  const getVisibleCount = (containerWidth: number, fromIndex: number) => {
    if (isNumber(itemWidthRef.current)) {
      return Math.ceil(containerWidth / itemWidthRef.current);
    }
    let sum = 0;
    let endIndex = 0;
    for (let i = fromIndex; i < list.length; i++) {
      const width = itemWidthRef.current(i, list[i]);
      sum += width;
      endIndex = i;
      if (sum >= containerWidth) {
        break;
      }
    }
    return endIndex - fromIndex;
  };

  // 根据滚动位置获取起始索引
  const getOffset = (scrollLeft: number) => {
    if (isNumber(itemWidthRef.current)) {
      return Math.floor(scrollLeft / itemWidthRef.current);
    }
    let sum = 0;
    let offset = 0;
    for (let i = 0; i < list.length; i++) {
      const width = itemWidthRef.current(i, list[i]);
      sum += width;
      if (sum >= scrollLeft) {
        offset = i;
        break;
      }
    }
    return offset + 1;
  };

  // 获取左侧距离
  const getDistanceLeft = (index: number) => {
    if (isNumber(itemWidthRef.current)) {
      const width = index * itemWidthRef.current;
      return width;
    }
    const width = list
      .slice(0, index)
      .reduce<number>(
        (sum, _, i) => sum + (itemWidthRef.current as ItemWidth<T>)(i, list[i]),
        0
      );
    return width;
  };

  // 计算总宽度
  const totalWidth = useMemo(() => {
    if (isNumber(itemWidthRef.current)) {
      return list.length * itemWidthRef.current;
    }
    return list.reduce<number>(
      (sum, _, index) =>
        sum + (itemWidthRef.current as ItemWidth<T>)(index, list[index]),
      0
    );
  }, [list]);

  const calculateRange = () => {
    const container = getTargetElement(containerTarget);
    if (container) {
      const { scrollLeft, clientWidth } = container;
      const offset = getOffset(scrollLeft);
      const visibleCount = getVisibleCount(clientWidth, offset);
      const start = Math.max(0, offset - overscan);
      const end = Math.min(list.length, offset + visibleCount + overscan);
      const offsetLeft = getDistanceLeft(start);

      setWrapperStyle({
        width: totalWidth - offsetLeft + "px",
        marginLeft: offsetLeft + "px",
      });

      setTargetList(
        list.slice(start, end).map((ele, index) => ({
          data: ele,
          index: index + start,
        }))
      );
    }
  };

  useUpdateEffect(() => {
    const wrapper = getTargetElement(wrapperTarget) as HTMLElement;
    if (wrapper) {
      Object.keys(wrapperStyle).forEach(
        (key) => ((wrapper.style as any)[key] = (wrapperStyle as any)[key])
      );
    }
  }, [wrapperStyle]);

  useEffect(() => {
    if (!size?.width || !size?.height) {
      return;
    }
    calculateRange();
  }, [size?.width, size?.height, list]);

  // 监听 scroll 事件
  useEventListener(
    "scroll",
    (e) => {
      if (scrollTriggerByScrollToFunc.current) {
        scrollTriggerByScrollToFunc.current = false;
        return;
      }
      e.preventDefault();
      calculateRange();
    },
    {
      target: containerTarget,
    }
  );

  // 监听 wheel 事件，将竖向滚动转换为横向滚动
  useEventListener(
    "wheel",
    (e: WheelEvent) => {
      const container = getTargetElement(containerTarget) as HTMLElement;
      if (!container) return;

      // 如果已经有横向滚动（deltaX），不处理
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      // 阻止默认的竖向滚动行为
      e.preventDefault();

      // 将竖向滚动转换为横向滚动
      const scrollAmount = e.deltaY;
      container.scrollLeft += scrollAmount;

      // 手动触发 calculateRange，因为 scrollLeft 变化不会触发 scroll 事件（在某些浏览器中）
      calculateRange();
    },
    {
      target: containerTarget,
      passive: false, // 重要：允许 preventDefault
    }
  );

  const scrollTo = (index: number) => {
    const container = getTargetElement(containerTarget);
    if (container) {
      scrollTriggerByScrollToFunc.current = true;
      container.scrollLeft = getDistanceLeft(index);
      calculateRange();
    }
  };

  return [targetList, useMemoizedFn(scrollTo)] as const;
};

export default useVirtualList;
