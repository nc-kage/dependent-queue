/* tslint:disable:max-classes-per-file */

import DependentQueue from '../../../src/DependentQueue';

interface IType {
  type: string;
  index: number;
}

class BaseType implements IType {
  private static index: number = 1;

  public readonly index: number;
  public readonly type: string = '';
  constructor() {
    this.index = BaseType.index;
    BaseType.index += 1;
  }
}

class FirstType extends BaseType implements IType {
  public readonly type: string = 'first';
}

class SecondType extends BaseType implements IType  {
  public readonly type: string = 'second';
}

class ThirdType extends BaseType implements IType  {
  public readonly type: string = 'third';
}

class FourthType extends BaseType implements IType  {
  public readonly type: string = 'fourth';
}

const typeGetter = (item: IType): string => item.type;

describe('DependentQueue', () => {
  it('return items in correct order for simple queue', () => {
    const first = new FirstType();
    const second = new SecondType();
    const dq = new DependentQueue();
    dq.offer(first);
    dq.offer(second);
    expect(dq.peek()).toEqual(first);
    expect(dq.peek()).toEqual(first);
    expect(dq.poll()).toEqual(first);
    expect(dq.peek()).toEqual(second);
    expect(dq.peek()).toEqual(second);
    expect(dq.poll()).toEqual(second);
    expect(dq.peek()).toBeNull();
    expect(dq.poll()).toBeNull();
  });

  it('return items in correct order for simple typed queue', () => {
    const first = new FirstType();
    const second = new SecondType();
    const dq = new DependentQueue(typeGetter);
    dq.offer(first);
    dq.offer(second);
    expect(dq.peek()).toEqual(first);
    expect(dq.peek()).toEqual(first);
    expect(dq.poll()).toEqual(first);
    expect(dq.peek()).toEqual(second);
    expect(dq.peek()).toEqual(second);
    expect(dq.poll()).toEqual(second);
    expect(dq.peek()).toBeNull();
    expect(dq.poll()).toBeNull();
  });

  it('return typed items in correct order for simple typed queue', () => {
    const first = new FirstType();
    const second = new SecondType();
    const dq = new DependentQueue(typeGetter);
    dq.offer(first);
    dq.offer(second);

    expect(dq.peek()).toEqual(first);
    expect(dq.peek()).toEqual(first);
    expect(dq.peek(first.type)).toEqual(first);
    expect(dq.peek(first.type)).toEqual(first);
    expect(dq.peek(second.type)).toEqual(second);
    expect(dq.peek(second.type)).toEqual(second);

    expect(dq.poll(first.type)).toEqual(first);
    expect(dq.peek(first.type)).toBeNull();
    expect(dq.poll(first.type)).toBeNull();

    expect(dq.peek()).toEqual(second);
    expect(dq.peek()).toEqual(second);
    expect(dq.peek(second.type)).toEqual(second);
    expect(dq.peek(second.type)).toEqual(second);

    expect(dq.poll(second.type)).toEqual(second);
    expect(dq.peek(second.type)).toBeNull();
    expect(dq.poll(second.type)).toBeNull();
  });

  it('return items in correct order for dependent queue', () => {
    const first = new FirstType();
    const second = new SecondType();
    const third = new FirstType();
    const dq = new DependentQueue();
    dq.offer(first);
    dq.offer(second, first);
    dq.offer(third, [second, first]);
    expect(dq.peek()).toEqual(first);
    expect(dq.peek()).toEqual(first);
    expect(dq.poll()).toEqual(first);
    expect(dq.peek()).toEqual(second);
    expect(dq.peek()).toEqual(second);
    expect(dq.poll()).toEqual(second);
    expect(dq.peek()).toEqual(third);
    expect(dq.peek()).toEqual(third);
    expect(dq.poll()).toEqual(third);
    expect(dq.peek()).toBeNull();
    expect(dq.poll()).toBeNull();
  });

  it('returns items in correct order for dependent queue', () => {
    const first = new FirstType();
    const second = new SecondType();
    const third = new FirstType();
    const dq = new DependentQueue();
    dq.offer(first);
    dq.offer(second, first);
    dq.offer(third, [second, first]);
    expect(dq.peek()).toEqual(first);
    expect(dq.peek()).toEqual(first);
    expect(dq.poll()).toEqual(first);
    expect(dq.peek()).toEqual(second);
    expect(dq.peek()).toEqual(second);
    expect(dq.poll()).toEqual(second);
    expect(dq.peek()).toEqual(third);
    expect(dq.peek()).toEqual(third);
    expect(dq.poll()).toEqual(third);
    expect(dq.peek()).toBeNull();
    expect(dq.poll()).toBeNull();
  });

  it('returns typed items in correct order for dependent queue', () => {
    const first = new FirstType();
    const second = new SecondType();
    const third = new ThirdType();
    const fourth = new FourthType();
    const dq = new DependentQueue(typeGetter);
    dq.offer(first);
    dq.offer(second);
    dq.offer(third, [first, second]);
    dq.offer(fourth, third);

    expect(dq.peek(first.type)).toEqual(first);
    expect(dq.peek()).toEqual(first);
    expect(dq.peek(second.type)).toEqual(second);
    expect(dq.checkQueueEmpty()).toBeFalsy();
    expect(dq.peek(third.type)).toBeNull();
    expect(dq.checkQueueEmpty(third.type)).toBeFalsy();
    expect(dq.peek(fourth.type)).toBeNull();

    expect(dq.poll(first.type)).toEqual(first);
    expect(dq.peek(first.type)).toBeNull();
    expect(dq.peek(second.type)).toEqual(second);
    expect(dq.peek()).toEqual(second);
    expect(dq.peek(third.type)).toBeNull();
    expect(dq.peek(fourth.type)).toBeNull();

    expect(dq.poll(second.type)).toEqual(second);
    expect(dq.peek(second.type)).toBeNull();
    expect(dq.peek(third.type)).toEqual(third);
    expect(dq.peek()).toEqual(third);
    expect(dq.peek(fourth.type)).toBeNull();

    expect(dq.peek(first.type)).toBeNull();
    expect(dq.peek(second.type)).toBeNull();
    expect(dq.poll(third.type)).toEqual(third);
    expect(dq.peek(third.type)).toBeNull();
    expect(dq.peek(fourth.type)).toEqual(fourth);
    expect(dq.peek()).toEqual(fourth);

    expect(dq.poll(fourth.type)).toEqual(fourth);
    expect(dq.peek(first.type)).toBeNull();
    expect(dq.peek(second.type)).toBeNull();
    expect(dq.peek(third.type)).toBeNull();
    expect(dq.peek(fourth.type)).toBeNull();
    expect(dq.peek()).toBeNull();
    expect(dq.checkQueueEmpty()).toBeTruthy();
    expect(dq.checkQueueEmpty(third.type)).toBeTruthy();
  });
});
