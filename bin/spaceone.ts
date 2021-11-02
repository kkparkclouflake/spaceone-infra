#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from '@aws-cdk/core';

import { ClusterStack } from '../lib/cluster-stack';
import { SpaceoneStack } from '../lib/spaceone-stack';

const app = new cdk.App();

// 환경에서 계정 정보 불러오기
const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = {account: account, region: 'us-west-2'};

// EKS 클러스터 구성
const clusterStack = new ClusterStack(app, 'ClusterStack', {
  env: primaryRegion,
});

// SpaceONE App 배포
const spaceoneStack = new SpaceoneStack(app, 'SpaceoneStack', clusterStack.eksProps);
spaceoneStack.node.addDependency(clusterStack);

app.synth();