#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SpaceoneStack } from '../lib/spaceone-stack';
import { SpaceoneAppDeploy } from '../lib/constructs/spaceone-app-deploy';
import { AwsEbsCsiDriverDeploy } from '../lib/constructs/aws-ebs-csi-driver-deploy';
import { AwsLoadBalancerControllerDeploy } from '../lib/constructs/aws-load-balancer-controller-deploy';
import { LookupZone } from '../lib/constructs/lookup-zone';
import { CreateCertificate } from '../lib/constructs/create-certificate';
import { ExternalDnsDeploy } from '../lib/constructs/external-dns-deploy';
import { DocumentDBCluster } from '../lib/constructs/documentdb-cluster';

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
const spaceoneStack = new SpaceoneStack(app, 'SpaceoneStack', {
  env: primaryRegion
});

// 각종 드라이버 설치
new AwsEbsCsiDriverDeploy(spaceoneStack, 'AwsEbsCsiDriverDeploy', {
  env: primaryRegion,cluster: spaceoneStack.cluster
});

new AwsLoadBalancerControllerDeploy(spaceoneStack, 'AwsLoadBalancerControllerDeploy', {
  env: primaryRegion,cluster: spaceoneStack.cluster
});

const lookupZone = new LookupZone(spaceoneStack, 'SpaceoneHostedZone', 'aws.sonnada.me');

const createCertificate = new CreateCertificate(spaceoneStack, 'CreateCertificate', lookupZone.domainProps);

new ExternalDnsDeploy(spaceoneStack, 'ExternalDnsDeploy', {
  env: primaryRegion,cluster: spaceoneStack.cluster
}, lookupZone.domainProps);

new DocumentDBCluster(spaceoneStack, 'DocumentDBCluster', spaceoneStack.vpc);

// // SpaceONE 어플리케이션 구성 (Helm Chart)
// new SpaceoneAppDeploy(spaceoneStack, 'SpaceoneAppDeploy', {
//   env: primaryRegion, cluster: spaceoneStack.cluster 
// })


app.synth();