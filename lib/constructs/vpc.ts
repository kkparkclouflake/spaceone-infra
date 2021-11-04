import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2'

export class Vpc extends cdk.Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id);
    
    // SpaceONE VPC
    // CDK 에서 Subnet IP Block 을 직접 설정하는 쉬운 방법이 없는것으로 보임 (CfnSubnet 등을 이용하여 CloudFormation 템플릿으로 처리?)
    const vpc = new ec2.Vpc(this, 'spaceone-prod-vpc', {
        cidr: '10.0.0.0/16',
        maxAzs: 3,
        vpnGateway: false,
        subnetConfiguration: [
          {
            name: 'public',
            subnetType: ec2.SubnetType.PUBLIC,
            cidrMask: 24,
          },
          {
            name: 'private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
            cidrMask: 23
          },
          {
            name: 'database',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 24
          }
        ]
      }
    );
    this.vpc = vpc;
  }
}