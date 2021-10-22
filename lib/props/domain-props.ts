import * as cdk from '@aws-cdk/core';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';

export interface DomainProps extends cdk.StackProps {
    domainName: string,
    hostedZone: route53.IHostedZone | undefined,
    certificate?: acm.Certificate
}