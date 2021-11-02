import * as cdk from '@aws-cdk/core';

import { SpaceoneAppDeploy } from '../lib/constructs/spaceone-app-deploy';
import { SpaceoneAppInitialize } from '../lib/constructs/spaceone-app-initialize';

import { EksProps } from './props/eks-props';

export class SpaceoneStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EksProps) {
    super(scope, id, props);

    // SpaceONE 어플리케이션 구성 (Helm Chart)
    const spaceone = new SpaceoneAppDeploy(this, 'SpaceoneAppDeploy', props);

    // SpaceONE 초기화 (Helm Chart)
    const initializer = new SpaceoneAppInitialize(this, 'SpaceoneAppInitialize', props);
    initializer.node.addDependency(spaceone);

  }
}