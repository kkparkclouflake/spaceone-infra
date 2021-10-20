#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SpaceoneStack } from '../lib/spaceone-stack';
import { SpaceoneAppDeploy } from '../lib/constructs/spaceone-app-deploy';

// const config = {
//   env: {
//     account: '139629787974',
//     region: 'us-west-2'
//   }
// }

const app = new cdk.App();

// 환경에서 계정 정보 불러오기
const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = {account: account, region: 'us-west-2'};

// EKS 클러스터 구성
const eksCluster = new SpaceoneStack(app, 'SpaceoneStack', {
  env: primaryRegion
});

// SpaceONE 어플리케이션 구성 (Helm Chart)
new SpaceoneAppDeploy(app, 'SpaceoneAppDeploy', {
  env: primaryRegion, cluster: eksCluster.cluster 
})

app.synth();