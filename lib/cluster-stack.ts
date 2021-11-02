import * as cdk from '@aws-cdk/core';

import { EksProps } from './props/eks-props';
import { Eks } from './constructs/eks';

import { AwsEbsCsiDriverDeploy } from './constructs/aws-ebs-csi-driver-deploy';
import { AwsLoadBalancerControllerDeploy } from './constructs/aws-load-balancer-controller-deploy';
import { HostedZone } from './constructs/hosted-zone';
import { Certificate } from './constructs/certificate';
import { ExternalDnsDeploy } from './constructs/external-dns-deploy';
import { DocumentDBCluster } from './constructs/documentdb-cluster';
import { AwsUser } from './constructs/aws-user';
import { Vpc } from './constructs/vpc';

export class ClusterStack extends cdk.Stack {
  public readonly eksProps: EksProps;

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    let vpc = new Vpc(this, 'SpaceoneVpc', props);

    let eks = new Eks(this, 'SpaceoneEksCluster', props, vpc.vpc, ['mzc_user04', 'mzc_user05']);

    this.eksProps = {
      env: props.env,
      vpc: vpc.vpc,
      cluster: eks.cluster
    };

    // DB 생성
    const createDatabase = new DocumentDBCluster(this, 'DocumentDBCluster', this.eksProps);

    // 각종 드라이버 설치
    const csiDriver = new AwsEbsCsiDriverDeploy(this, 'AwsEbsCsiDriverDeploy', this.eksProps);

    const lbController = new AwsLoadBalancerControllerDeploy(this, 'AwsLoadBalancerControllerDeploy', this.eksProps);

    // HostedZone 을 찾아와서 인증서 생성 후 연동
    const lookupZone = new HostedZone(this, 'SpaceoneHostedZone', 'aws.sonnada.me');

    const createCertificate = new Certificate(this, 'CreateCertificate', lookupZone.domainProps);

    const externalDns = new ExternalDnsDeploy(this, 'ExternalDnsDeploy', this.eksProps, lookupZone.domainProps);
    externalDns.node.addDependency(createCertificate);

    // Secret Service 접근용 유저 생성
    const awsUser = new AwsUser(this, 'CreateAwsUser', props);

    // Finally
    this.eksProps.createdDocdb = createDatabase;
    this.eksProps.createdDomain = lookupZone.domainProps;
    this.eksProps.createdUser = awsUser;
  }
}