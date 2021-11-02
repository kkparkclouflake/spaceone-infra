#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from '@aws-cdk/core';

import { SpaceoneStack } from '../lib/spaceone-stack';
import { SpaceoneAppDeploy } from '../lib/constructs/spaceone-app-deploy';
import { AwsEbsCsiDriverDeploy } from '../lib/constructs/aws-ebs-csi-driver-deploy';
import { AwsLoadBalancerControllerDeploy } from '../lib/constructs/aws-load-balancer-controller-deploy';
import { HostedZone } from '../lib/constructs/hosted-zone';
import { CreateCertificate } from '../lib/constructs/create-certificate';
import { ExternalDnsDeploy } from '../lib/constructs/external-dns-deploy';
import { DocumentDBCluster } from '../lib/constructs/documentdb-cluster';
import { CreateAwsUser } from '../lib/constructs/create-aws-user';

import { EksProps } from '../lib/props/eks-props'
import { SpaceoneAppInitialize } from '../lib/constructs/spaceone-app-initialize';

const app = new cdk.App();

// 환경에서 계정 정보 불러오기
const account = app.node.tryGetContext('account') || process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT;
const primaryRegion = {account: account, region: 'us-west-2'};

// EKS 클러스터 구성
const spaceoneStack = new SpaceoneStack(app, 'SpaceoneStack', {
  env: primaryRegion
});

let eksProp: EksProps = {
  env: primaryRegion, cluster: spaceoneStack.cluster
};

// DB 생성
const createDatabase = new DocumentDBCluster(spaceoneStack, 'DocumentDBCluster', eksProp);

// 각종 드라이버 설치
const csiDriver = new AwsEbsCsiDriverDeploy(spaceoneStack, 'AwsEbsCsiDriverDeploy', eksProp);

const lbController = new AwsLoadBalancerControllerDeploy(spaceoneStack, 'AwsLoadBalancerControllerDeploy', eksProp);

// HostedZone 을 찾아와서 인증서 생성 후 연동
const lookupZone = new HostedZone(spaceoneStack, 'SpaceoneHostedZone', 'aws.sonnada.me');

const createCertificate = new CreateCertificate(spaceoneStack, 'CreateCertificate', lookupZone.domainProps);

const externalDns = new ExternalDnsDeploy(spaceoneStack, 'ExternalDnsDeploy', eksProp, lookupZone.domainProps);
externalDns.node.addDependency(createCertificate);

// Secret Service 접근용 유저 생성
const createUserSecret = new CreateAwsUser(spaceoneStack, 'CreateAwsUser', eksProp);

// SpaceONE 어플리케이션 구성 (Helm Chart)
const spaceone = new SpaceoneAppDeploy(spaceoneStack, 'SpaceoneAppDeploy', eksProp, lookupZone.domainProps, createUserSecret.secretKey, createDatabase.database);
spaceone.node.addDependency(createDatabase);
spaceone.node.addDependency(csiDriver);
spaceone.node.addDependency(lbController);
spaceone.node.addDependency(externalDns);

// SpaceONE 초기화 (Helm Chart)
const initializer = new SpaceoneAppInitialize(spaceoneStack, 'SpaceoneAppInitialize', eksProp);
initializer.node.addDependency(spaceone);

app.synth();